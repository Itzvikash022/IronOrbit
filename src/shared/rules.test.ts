import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_GAME_SETTINGS, SCORING } from './config';
import {
  activatePowerUp,
  applyTankDamage,
  assignBalancedTeam,
  buildLeaderboard,
  canTankFire,
  consumeAmmo,
  evaluateFlagInteraction,
  pruneExpiredPowerUps,
  tickAmmoRegen,
} from './rules';
import { FlagEntity, TankEntity } from './types';

function makeTank(overrides: Partial<TankEntity> = {}): TankEntity {
  return {
    id: 'p1',
    nickname: 'Alpha',
    team: 'none',
    skinIndex: 0,
    x: 500,
    y: 500,
    vx: 0,
    vy: 0,
    angle: 0,
    aimAngle: 0,
    hp: 100,
    maxHp: 100,
    ammo: 6,
    maxAmmo: 6,
    ammoRegenProgress: 0,
    lastShotAt: 0,
    alive: true,
    respawnAt: 0,
    invincibleUntil: 0,
    activePowerUps: [],
    kills: 0,
    deaths: 0,
    assists: 0,
    captures: 0,
    score: 0,
    carryingFlag: 'none',
    connected: true,
    lastProcessedSeq: 0,
    ...overrides,
  };
}

test('ammo consumption, zero-ammo lock, infinite ammo override, and regeneration', () => {
  const tank = makeTank({ ammo: 1, lastShotAt: 0 });
  assert.equal(canTankFire(tank, 1000, DEFAULT_GAME_SETTINGS), true);
  consumeAmmo(tank, 1000);
  assert.equal(tank.ammo, 0);
  assert.equal(canTankFire(tank, 2000, DEFAULT_GAME_SETTINGS), false);

  // Infinite ammo overrides 0 ammo
  activatePowerUp(tank, 'infinite_ammo', 2000, DEFAULT_GAME_SETTINGS);
  assert.equal(canTankFire(tank, 2000, DEFAULT_GAME_SETTINGS), true);
  consumeAmmo(tank, 2000);
  assert.equal(tank.ammo, 0);

  // Ammo regenerates when below max
  const regenTank = makeTank({ ammo: 4, maxAmmo: 6 });
  const refilled = tickAmmoRegen(regenTank, 1.5, DEFAULT_GAME_SETTINGS);
  assert.equal(refilled, true);
  assert.equal(regenTank.ammo, 5);
});

test('damage respects self-immunity, CTF friendly fire off, invincibility, shield, and double damage', () => {
  const victim = makeTank({ id: 'v1', team: 'blue', hp: 100 });

  // Self-damage blocked
  const selfRes = applyTankDamage(victim, 'v1', 'blue', 25, false, 'deathmatch', 1000);
  assert.equal(selfRes.blockedReason, 'self');
  assert.equal(victim.hp, 100);

  // Friendly fire blocked in CTF
  const ffRes = applyTankDamage(victim, 'ally1', 'blue', 25, false, 'ctf', 1000);
  assert.equal(ffRes.blockedReason, 'friendly');
  assert.equal(victim.hp, 100);

  // Invincibility blocks damage
  victim.invincibleUntil = 4000;
  const invRes = applyTankDamage(victim, 'enemy1', 'red', 25, false, 'ctf', 1000);
  assert.equal(invRes.blockedReason, 'invincible');

  // Shield power-up blocks damage
  victim.invincibleUntil = 0;
  activatePowerUp(victim, 'shield', 1000, DEFAULT_GAME_SETTINGS);
  const shdRes = applyTankDamage(victim, 'enemy1', 'red', 25, false, 'ctf', 1500);
  assert.equal(shdRes.blockedReason, 'shield');

  // Expire shield -> double damage hits for 50
  pruneExpiredPowerUps(victim, 20000);
  const dmgRes = applyTankDamage(victim, 'enemy1', 'red', 25, true, 'ctf', 20000);
  assert.equal(dmgRes.appliedDamage, 50);
  assert.equal(victim.hp, 50);
  assert.equal(dmgRes.eliminated, false);

  // Final hit eliminates
  const killRes = applyTankDamage(victim, 'enemy1', 'red', 25, true, 'ctf', 20100);
  assert.equal(killRes.eliminated, true);
  assert.equal(victim.alive, false);
});

test('power-ups do not permanently stack and instant power-ups heal/refill immediately', () => {
  const tank = makeTank({ hp: 40, ammo: 1 });
  activatePowerUp(tank, 'health_restore', 1000, DEFAULT_GAME_SETTINGS);
  assert.equal(tank.hp, 85);

  activatePowerUp(tank, 'extra_ammo', 1000, DEFAULT_GAME_SETTINGS);
  assert.equal(tank.ammo, 6);

  activatePowerUp(tank, 'speed', 1000, DEFAULT_GAME_SETTINGS);
  activatePowerUp(tank, 'speed', 3000, DEFAULT_GAME_SETTINGS);
  assert.equal(tank.activePowerUps.length, 1);
  assert.equal(tank.activePowerUps[0].expiresAt, 3000 + DEFAULT_GAME_SETTINGS.powerUpDurationMs);
});

test('CTF flag pickup, drop/return, and capture require own flag at base', () => {
  const redFlag: FlagEntity = { team: 'red', x: 140, y: 600, homeX: 140, homeY: 600, state: 'at_base', carrierId: null };
  const blueFlag: FlagEntity = { team: 'blue', x: 1660, y: 600, homeX: 1660, homeY: 600, state: 'at_base', carrierId: null };
  const bases = {
    red: { x: 140, y: 600, radius: 68 },
    blue: { x: 1660, y: 600, radius: 68 },
  };

  const redCarrier = makeTank({ id: 'r1', team: 'red', x: 1660, y: 600 });
  const pickup = evaluateFlagInteraction(redCarrier, { red: redFlag, blue: blueFlag }, bases);
  assert.equal(pickup.event, 'pickup');
  assert.equal(redCarrier.carryingFlag, 'blue');
  assert.equal(blueFlag.state, 'carried');

  // If red flag is dropped elsewhere, redCarrier cannot score yet
  redFlag.state = 'dropped';
  redFlag.x = 900;
  redFlag.y = 600;
  redCarrier.x = 140;
  redCarrier.y = 600;
  const blockedCap = evaluateFlagInteraction(redCarrier, { red: redFlag, blue: blueFlag }, bases);
  assert.equal(blockedCap.event, 'none');

  // Defending teammate returns red flag
  const redDefender = makeTank({ id: 'r2', team: 'red', x: 900, y: 600 });
  const ret = evaluateFlagInteraction(redDefender, { red: redFlag, blue: blueFlag }, bases);
  assert.equal(ret.event, 'return');
  assert.equal(redFlag.state, 'at_base');

  // Now redCarrier captures blue flag
  const cap = evaluateFlagInteraction(redCarrier, { red: redFlag, blue: blueFlag }, bases);
  assert.equal(cap.event, 'capture');
  assert.equal(redCarrier.captures, 1);
  assert.equal(redCarrier.score, SCORING.FLAG_CAPTURE);
});

test('leaderboard sorts by score primary then kills secondary and team assignment balances', () => {
  const t1 = makeTank({ id: '1', nickname: 'A', score: 200, kills: 1 });
  const t2 = makeTank({ id: '2', nickname: 'B', score: 200, kills: 2 });
  const t3 = makeTank({ id: '3', nickname: 'C', score: 350, kills: 1 });

  const board = buildLeaderboard([t1, t2, t3]);
  assert.deepEqual(board.map((e) => e.id), ['3', '2', '1']);
  assert.equal(board[0].rank, 1);

  assert.equal(assignBalancedTeam([{ team: 'red' }, { team: 'red' }, { team: 'blue' }]), 'blue');
  assert.equal(assignBalancedTeam([{ team: 'red' }, { team: 'blue' }]), 'red');
});
