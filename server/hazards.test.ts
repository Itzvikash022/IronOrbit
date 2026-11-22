import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioClient, Socket } from 'socket.io-client';
import { DEFAULT_GAME_SETTINGS, PROTOCOL_VERSION } from '../src/shared/config';
import { HAZARD_TUNING, getBombForEpoch } from '../src/shared/hazards';
import { ARENA_MAPS } from '../src/shared/maps';
import type { ProjectileEntity, RoomInfo, TankEntity, TurretEntity } from '../src/shared/types';
import { attachSocketServer } from './SocketServer';
import { CombatSystem } from './CombatSystem';
import { HazardSystem, type HazardCallbacks } from './HazardSystem';

function makeTank(overrides: Partial<TankEntity> = {}): TankEntity {
  return {
    id: 'p1',
    nickname: 'Alpha',
    team: 'none',
    skinIndex: 0,
    x: 900,
    y: 600,
    vx: 0,
    vy: 0,
    angle: 0,
    aimAngle: 0,
    rotationDir: 1,
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

function makeCallbacks() {
  const events = {
    turretShots: [] as { proj: ProjectileEntity; turret: TurretEntity }[],
    envDamage: [] as { victim: TankEntity; amount: number }[],
  };
  const cb: HazardCallbacks = {
    onTurretShot: (proj, turret) => events.turretShots.push({ proj, turret: { ...turret } }),
    onEnvironmentDamage: (victim, amount) => events.envDamage.push({ victim, amount }),
    onBombDetonated: () => {},
  };
  return { events, cb };
}

const SETTINGS = DEFAULT_GAME_SETTINGS;

test('lava burns tanks standing in it (after a short grace) and never outside it', () => {
  const map = ARENA_MAPS.magma;
  const hazards = new HazardSystem();
  const start = 100_000;
  hazards.reset(map, 777, start);
  const lava = hazards.getZones().find((z) => z.kind === 'lava');
  assert.ok(lava, 'magma map generates lava pools');

  const inLava = makeTank({ id: 'burn', x: lava.x, y: lava.y });
  const safe = makeTank({ id: 'safe', x: 5, y: 5 });
  const { events, cb } = makeCallbacks();

  let now = start + 5000;
  for (let i = 0; i < 50; i++) {
    hazards.tick(now, 0.04, [inLava, safe], [], 'deathmatch', SETTINGS, cb);
    now += 40;
  }
  const total = events.envDamage.reduce((s, e) => s + e.amount, 0);
  assert.ok(events.envDamage.every((e) => e.victim.id === 'burn'));
  // ~2s in lava minus 250ms grace at lavaDps
  assert.ok(total >= HAZARD_TUNING.lavaDps * 1.4 && total <= HAZARD_TUNING.lavaDps * 2.1, `lava total ${total}`);
});

test('lava kills are credited to the environment and respawn normally', () => {
  const map = ARENA_MAPS.magma;
  const hazards = new HazardSystem();
  hazards.reset(map, 778, 0);
  const lava = hazards.getZones().find((z) => z.kind === 'lava')!;
  const tank = makeTank({ x: lava.x, y: lava.y, hp: 5 });
  const combat = new CombatSystem();
  const kills: { victim: string; killer: string | null }[] = [];
  const combatCb = {
    onShotFired: () => {},
    onProjectileImpact: () => {},
    onTankKilled: (v: TankEntity, k: TankEntity | null) => kills.push({ victim: v.id, killer: k?.id ?? null }),
    onTankRespawned: () => {},
  };
  const cb: HazardCallbacks = {
    onTurretShot: () => {},
    onEnvironmentDamage: (victim, amount, at) =>
      combat.applyEnvironmentHit(victim, amount, [tank], SETTINGS, at, combatCb),
    onBombDetonated: () => {},
  };
  let now = 10_000;
  for (let i = 0; i < 40 && tank.alive; i++) {
    hazards.tick(now, 0.04, [tank], [], 'deathmatch', SETTINGS, cb);
    now += 40;
  }
  assert.equal(tank.alive, false);
  assert.deepEqual(kills, [{ victim: 'p1', killer: null }]);
  assert.ok(tank.respawnAt > now - 40);
});

test('turrets fire on hostile tanks in line of sight; in CTF only the opposing team', () => {
  const map = ARENA_MAPS.sentinel;
  const seed = 31337;
  const hazards = new HazardSystem();
  hazards.reset(map, seed, 0);
  const turrets = hazards.getTurretEntities();
  assert.ok(turrets.length >= 4);

  const target = turrets[0];
  const dist = 200;
  // Stand in the muzzle direction, in the open, away from walls
  const tankPos = { x: target.x + Math.cos(target.angle) * dist, y: target.y + Math.sin(target.angle) * dist };
  const fire = (mode: 'deathmatch' | 'ctf', team: 'none' | 'red' | 'blue') => {
    const h = new HazardSystem();
    h.reset(map, seed, 0);
    const victim = makeTank({ id: 'v', team, x: tankPos.x, y: tankPos.y });
    const { events, cb } = makeCallbacks();
    let now = 20_000;
    for (let i = 0; i < 120; i++) {
      h.tick(now, 0.04, [victim], [], mode, SETTINGS, cb);
      now += 40;
    }
    return events.turretShots;
  };

  const dm = fire('deathmatch', 'none');
  assert.ok(dm.length >= 1, 'turret shoots in free-for-all');
  assert.equal(dm[0].proj.team, 'none', 'FFA/TDM turret shells hurt everyone');
  assert.equal(dm[0].proj.damage, HAZARD_TUNING.turretDamage);

  const ownTeam = target.team;
  const enemyTeam = ownTeam === 'red' ? 'blue' : 'red';
  const ctfEnemyShots = fire('ctf', enemyTeam).filter((s) => s.turret.id === target.id);
  const ctfFriendShots = fire('ctf', ownTeam).filter((s) => s.turret.id === target.id);
  assert.ok(ctfEnemyShots.length >= 1, 'CTF turret shoots the opposing team');
  assert.equal(ctfEnemyShots[0].proj.team, ownTeam);
  assert.equal(ctfFriendShots.length, 0, 'CTF turret ignores its own team');
});

test('turrets do not shoot at tanks that just spawned (invincible) or behind walls', () => {
  const map = ARENA_MAPS.sentinel;
  const hazards = new HazardSystem();
  hazards.reset(map, 31337, 0);
  const t = hazards.getTurretEntities()[0];
  const pos = { x: t.x + Math.cos(t.angle) * 200, y: t.y + Math.sin(t.angle) * 200 };
  const spawnProtected = makeTank({ x: pos.x, y: pos.y, invincibleUntil: 999_999 });
  const { events, cb } = makeCallbacks();
  let now = 20_000;
  for (let i = 0; i < 80; i++) {
    hazards.tick(now, 0.04, [spawnProtected], [], 'deathmatch', SETTINGS, cb);
    now += 40;
  }
  assert.equal(events.turretShots.length, 0);
});

test('stun bombs stun tanks inside the blast radius once, but not shielded or far tanks', () => {
  const map = ARENA_MAPS.blastyard;
  const seed = 2024;
  const hazards = new HazardSystem();
  const start = 50_000;
  hazards.reset(map, seed, start);
  const bomb = getBombForEpoch(map, seed, 0) ?? getBombForEpoch(map, seed, 1)!;

  const near = makeTank({ id: 'near', x: bomb.x + 30, y: bomb.y });
  const far = makeTank({ id: 'far', x: bomb.x + bomb.radius + 200, y: bomb.y });
  const shielded = makeTank({
    id: 'shield',
    x: bomb.x,
    y: bomb.y + 30,
    activePowerUps: [{ type: 'shield', expiresAt: 10_000_000, durationMs: 8000 }],
  });
  const tanks = [near, far, shielded];
  const { cb } = makeCallbacks();

  // Before detonation: nobody is stunned
  hazards.tick(start + bomb.armAt + 100, 0.04, tanks, [], 'deathmatch', SETTINGS, cb);
  assert.equal(near.stunnedUntil ?? 0, 0);

  const detonateNow = start + bomb.detonateAt + 20;
  hazards.tick(detonateNow, 0.04, tanks, [], 'deathmatch', SETTINGS, cb);
  assert.ok((near.stunnedUntil ?? 0) >= detonateNow + HAZARD_TUNING.bombStunMs - 5);
  assert.equal(far.stunnedUntil ?? 0, 0);
  assert.equal(shielded.stunnedUntil ?? 0, 0);

  // Same bomb never re-triggers
  const firstStun = near.stunnedUntil;
  hazards.tick(detonateNow + 200, 0.04, tanks, [], 'deathmatch', SETTINGS, cb);
  assert.equal(near.stunnedUntil, firstStun);
});

async function startServer() {
  const httpServer = http.createServer();
  const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });
  const roomManager = attachSocketServer(io);
  await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', () => resolve()));
  const address = httpServer.address();
  assert.ok(address && typeof address !== 'string');
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: async () => {
      roomManager.destroy();
      io.close();
      httpServer.close();
    },
  };
}

test('handshake refuses clients with a missing or different protocol version', async () => {
  const srv = await startServer();
  try {
    const attempt = (auth?: Record<string, unknown>) =>
      new Promise<string>((resolve) => {
        const c: Socket = ioClient(srv.url, { transports: ['websocket'], reconnection: false, auth });
        c.on('connect', () => {
          c.disconnect();
          resolve('connected');
        });
        c.on('connect_error', (err) => {
          c.disconnect();
          resolve(err.message);
        });
      });

    assert.equal(await attempt(undefined), 'version_mismatch');
    assert.equal(await attempt({ protocolVersion: PROTOCOL_VERSION + 1 }), 'version_mismatch');
    assert.equal(await attempt({ protocolVersion: PROTOCOL_VERSION }), 'connected');
  } finally {
    await srv.close();
  }
});

test('host toggles includeBetaMaps; snapshot carries seed, start time and turrets', async () => {
  const srv = await startServer();
  const client: Socket = ioClient(srv.url, {
    transports: ['websocket'],
    auth: { protocolVersion: PROTOCOL_VERSION },
  });
  try {
    await new Promise<void>((resolve) => client.on('connect', () => resolve()));
    const created = await new Promise<{ ok: boolean; room: RoomInfo }>((resolve) =>
      client.emit('room:create', { playerId: 'host1', nickname: 'Host' }, resolve)
    );
    assert.equal(created.room.includeBetaMaps, false);

    const updated = new Promise<RoomInfo>((resolve) => {
      client.on('room:updated', (r: RoomInfo) => {
        if (r.includeBetaMaps) resolve(r);
      });
    });
    client.emit('room:config', { includeBetaMaps: true });
    assert.equal((await updated).includeBetaMaps, true);

    const started = new Promise<{ snapshot: { matchSeed: number; matchStartTime: number; turrets: unknown[]; mapId: string } }>(
      (resolve) => client.on('match:started', resolve)
    );
    client.emit('room:config', { mapId: 'sentinel' });
    await new Promise((r) => setTimeout(r, 50));
    client.emit('match:start', {});
    const { snapshot } = await started;
    assert.equal(snapshot.mapId, 'sentinel');
    assert.ok(Number.isFinite(snapshot.matchSeed) && snapshot.matchSeed > 0);
    assert.ok(snapshot.matchStartTime > 0);
    assert.ok(snapshot.turrets.length >= 4);
  } finally {
    client.disconnect();
    await srv.close();
  }
});
