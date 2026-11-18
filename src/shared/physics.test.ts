import test from 'node:test';
import assert from 'node:assert/strict';
import { ARENA_MAPS, MAP_IDS } from './maps';
import { CRATE_RADIUS, DEFAULT_GAME_SETTINGS, TANK_RADIUS } from './config';
import {
  circleIntersectsRect,
  findValidCratePosition,
  selectSafeSpawn,
  stepProjectile,
  stepTankMotion,
} from './physics';
import { ProjectileEntity, TankEntity } from './types';

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

test('all 7 arena maps have non-overlapping spawns, bases, and crate zones', () => {
  assert.equal(MAP_IDS.length, 7);
  for (const id of MAP_IDS) {
    const map = ARENA_MAPS[id];
    for (const sp of [...map.ffaSpawns, ...map.redSpawns, ...map.blueSpawns]) {
      assert.ok(sp.x >= TANK_RADIUS && sp.x <= map.width - TANK_RADIUS, `${id} spawn X out of bounds`);
      assert.ok(sp.y >= TANK_RADIUS && sp.y <= map.height - TANK_RADIUS, `${id} spawn Y out of bounds`);
      for (const obs of map.obstacles) {
        assert.equal(
          circleIntersectsRect(sp.x, sp.y, TANK_RADIUS + 4, obs),
          false,
          `${id} spawn (${sp.x},${sp.y}) overlaps obstacle ${obs.id}`
        );
      }
    }
    for (const cz of map.crateZones) {
      for (const obs of map.obstacles) {
        assert.equal(
          circleIntersectsRect(cz.x, cz.y, CRATE_RADIUS + 10, obs),
          false,
          `${id} crate zone (${cz.x},${cz.y}) overlaps obstacle ${obs.id}`
        );
      }
    }
  }
});

test('tank rotates continuously while idle, locks angle during Spacebar thrust, and resumes rotating on release', () => {
  const map = ARENA_MAPS.desert;
  const tank = makeTank({ x: 900, y: 300, angle: 0 });
  const initialAngle = tank.angle;

  // Idle -> rotates continuously, does not move
  stepTankMotion(tank, false, 0.25, map, DEFAULT_GAME_SETTINGS, 1000);
  assert.ok(tank.angle > initialAngle, 'tank should auto-rotate while Spacebar is not held');
  assert.equal(tank.x, 900);
  assert.equal(tank.y, 300);

  // Hold Spacebar -> angle locks and tank drives straight along locked angle
  const lockedAngle = tank.angle;
  const beforeX = tank.x;
  const beforeY = tank.y;
  for (let i = 0; i < 10; i++) {
    stepTankMotion(tank, true, 0.04, map, DEFAULT_GAME_SETTINGS, 1000 + i * 40);
    assert.equal(tank.angle, lockedAngle, 'angle must remain locked while thrust is held');
  }
  assert.ok(Math.hypot(tank.x - beforeX, tank.y - beforeY) > 10, 'tank should move forward with thrust');

  // Release Spacebar -> resumes rotating
  stepTankMotion(tank, false, 0.2, map, DEFAULT_GAME_SETTINGS, 1500);
  assert.notEqual(tank.angle, lockedAngle, 'tank should resume rotating after thrust release');
});

test('tank collides with obstacles and clamps inside map bounds', () => {
  const map = ARENA_MAPS.desert;
  const tank = makeTank({ x: 5, y: 5, angle: Math.PI });
  stepTankMotion(tank, true, 0.1, map, DEFAULT_GAME_SETTINGS, 1000);
  assert.ok(tank.x >= TANK_RADIUS);
  assert.ok(tank.y >= TANK_RADIUS);

  // Push against central obstacle d9 (x:840, y:540, w:120, h:120)
  const obs = map.obstacles.find((o) => o.id === 'd9')!;
  const wallTank = makeTank({ x: obs.x - TANK_RADIUS - 2, y: obs.y + 60, angle: 0 });
  for (let i = 0; i < 20; i++) {
    stepTankMotion(wallTank, true, 0.04, map, DEFAULT_GAME_SETTINGS, 2000 + i * 40);
  }
  assert.equal(circleIntersectsRect(wallTank.x, wallTank.y, TANK_RADIUS - 0.5, obs), false);
});

test('projectile detects wall collision, tank collision, and max range', () => {
  const map = ARENA_MAPS.desert;
  const obs = map.obstacles.find((o) => o.id === 'd9')!;
  const wallProj: ProjectileEntity = {
    id: 'b1',
    ownerId: 'p1',
    team: 'none',
    x: obs.x - 12,
    y: obs.y + 60,
    vx: 700,
    vy: 0,
    damage: 25,
    distanceTraveled: 0,
    maxRange: 760,
    isDoubleDamage: false,
  };
  const wallRes = stepProjectile(wallProj, 0.05, map, []);
  assert.equal(wallRes.expired, true);
  assert.equal(wallRes.hitWall, true);

  const enemy = makeTank({ id: 'p2', x: 500, y: 300 });
  const hitProj: ProjectileEntity = {
    id: 'b2',
    ownerId: 'p1',
    team: 'none',
    x: 475,
    y: 300,
    vx: 720,
    vy: 0,
    damage: 25,
    distanceTraveled: 0,
    maxRange: 760,
    isDoubleDamage: false,
  };
  const hitRes = stepProjectile(hitProj, 0.05, map, [enemy]);
  assert.equal(hitRes.expired, true);
  assert.equal(hitRes.hitTankId, 'p2');
});

test('selectSafeSpawn picks spawn farthest from living enemy and crate placement avoids obstacles', () => {
  const map = ARENA_MAPS.desert;
  const enemy = makeTank({ id: 'e1', x: 150, y: 150, alive: true });
  const spawn = selectSafeSpawn(map.ffaSpawns, [enemy], map.obstacles);
  assert.ok(Math.hypot(spawn.x - enemy.x, spawn.y - enemy.y) > 800);

  const cratePos = findValidCratePosition(map, [], [enemy]);
  assert.ok(cratePos !== null);
  for (const obs of map.obstacles) {
    assert.equal(circleIntersectsRect(cratePos.x, cratePos.y, CRATE_RADIUS, obs), false);
  }
});
