import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARENA_MAPS,
  BETA_MAP_IDS,
  CLASSIC_MAP_IDS,
  MAP_IDS,
  getRandomMapId,
} from './maps';
import { DEFAULT_GAME_SETTINGS, TANK_RADIUS } from './config';
import {
  HAZARD_TUNING,
  generateMapHazards,
  getActiveBomb,
  getBombForEpoch,
  getMapWindAt,
  getSurfaceAt,
  getWindAt,
  isInGrass,
  windAcceleration,
} from './hazards';
import { circleIntersectsRect, stepProjectile, stepTankMotion } from './physics';
import { applyEnvironmentDamage, canTankFire } from './rules';
import type { ProjectileEntity, TankEntity } from './types';

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

const SEEDS = Array.from({ length: 120 }, (_, i) => (i + 1) * 104729);

test('map registry: 7 classic + 7 beta, beta maps flagged and categorized', () => {
  assert.equal(CLASSIC_MAP_IDS.length, 7);
  assert.equal(BETA_MAP_IDS.length, 7);
  assert.equal(MAP_IDS.length, 14);
  for (const id of CLASSIC_MAP_IDS) {
    assert.equal(ARENA_MAPS[id].beta, false);
    assert.equal(ARENA_MAPS[id].category, 'classic');
  }
  const terrain = BETA_MAP_IDS.filter((id) => ARENA_MAPS[id].category === 'terrain');
  const obstacle = BETA_MAP_IDS.filter((id) => ARENA_MAPS[id].category === 'obstacle');
  assert.equal(terrain.length, 4);
  assert.equal(obstacle.length, 3);
  for (const id of BETA_MAP_IDS) {
    assert.equal(ARENA_MAPS[id].beta, true);
    assert.ok(ARENA_MAPS[id].hazardSpec, `${id} has a hazardSpec`);
    if (ARENA_MAPS[id].category === 'terrain') {
      assert.ok(ARENA_MAPS[id].hazardSpec?.terrainUlt, `${id} terrainUlt`);
      assert.equal(ARENA_MAPS[id].bakedFloor, true);
      assert.equal(!!ARENA_MAPS[id].hazardSpec?.surfaces?.length, false);
      assert.equal(!!ARENA_MAPS[id].hazardSpec?.wind, false);
    }
  }
});

test('getRandomMapId only returns classic maps unless beta is included', () => {
  for (let i = 0; i < 300; i++) {
    assert.ok(CLASSIC_MAP_IDS.includes(getRandomMapId() as never));
    assert.ok(CLASSIC_MAP_IDS.includes(getRandomMapId('desert') as never));
    assert.notEqual(getRandomMapId('desert'), 'desert');
  }
  let sawBeta = false;
  for (let i = 0; i < 600 && !sawBeta; i++) {
    if (BETA_MAP_IDS.includes(getRandomMapId(undefined, true) as never)) sawBeta = true;
  }
  assert.ok(sawBeta, 'beta maps appear when included');
});

test('hazard generation is deterministic per seed and varies between seeds', () => {
  for (const id of BETA_MAP_IDS) {
    const map = ARENA_MAPS[id];
    const a = generateMapHazards(map, 12345);
    const b = generateMapHazards(map, 12345);
    assert.deepEqual(a, b, `${id} same seed => same layout`);
  }
  const overgrowth = ARENA_MAPS.overgrowth;
  const layouts = new Set(SEEDS.map((s) => JSON.stringify(generateMapHazards(overgrowth, s).zones)));
  assert.ok(layouts.size > SEEDS.length * 0.9, 'grass patches are randomized per match');
});

test('generated zones and turrets respect counts, spawns, bases, crates and obstacles', () => {
  for (const id of BETA_MAP_IDS) {
    const map = ARENA_MAPS[id];
    const spec = map.hazardSpec!;
    for (const seed of SEEDS) {
      const { zones, turrets } = generateMapHazards(map, seed);

      for (const surf of spec.surfaces ?? []) {
        const n = zones.filter((z) => z.kind === surf.kind).length;
        assert.ok(n >= surf.count[0] && n <= surf.count[1], `${id}/${seed} ${surf.kind} count ${n}`);
      }
      if (spec.turrets) {
        assert.ok(
          turrets.length >= spec.turrets[0] && turrets.length <= spec.turrets[1],
          `${id}/${seed} turret count ${turrets.length}`
        );
      }

      const points = [...map.ffaSpawns, ...map.redSpawns, ...map.blueSpawns, ...map.crateZones];
      for (const z of zones) {
        // Not in the dead center of the map
        assert.ok(
          Math.abs(z.x - map.width / 2) >= 300 || Math.abs(z.y - map.height / 2) >= 220,
          `${id}/${seed} ${z.id} too central`
        );
        for (const p of points) {
          assert.equal(getSurfaceAt([z], p.x, p.y), 'none', `${id}/${seed} ${z.id} covers a spawn/crate`);
          assert.equal(isInGrass([z], p.x, p.y), false, `${id}/${seed} ${z.id} grass covers a spawn/crate`);
        }
        for (const base of [map.redBase, map.blueBase]) {
          assert.ok(Math.hypot(z.x - base.x, z.y - base.y) > 20, `${id}/${seed} ${z.id} on a flag base`);
          assert.equal(getSurfaceAt([z], base.x, base.y), 'none');
        }
        for (const o of map.obstacles) {
          const inside =
            z.x >= o.x && z.x <= o.x + o.w && z.y >= o.y && z.y <= o.y + o.h;
          assert.equal(inside, false, `${id}/${seed} ${z.id} center inside ${o.id}`);
        }
      }

      for (const t of turrets) {
        for (const p of points) {
          assert.ok(Math.hypot(t.x - p.x, t.y - p.y) > 200, `${id}/${seed} ${t.id} too close to spawn/crate`);
        }
        for (const o of map.obstacles) {
          // Mounted turret sits against exactly one wall; it may not clip a second one
          const touching = circleIntersectsRect(t.x, t.y, HAZARD_TUNING.turretRadius, o);
          assert.equal(touching, false, `${id}/${seed} ${t.id} clips ${o.id}`);
        }
        assert.equal(t.team, t.x < map.width / 2 ? 'red' : 'blue');
      }
    }
  }
});

test('sand slows the tank, ice makes it skid and keep sliding', () => {
  const map = ARENA_MAPS.dunes;
  const run = (surface: 'none' | 'sand' | 'ice', thrustFrames: number, coastFrames: number) => {
    const tank = makeTank({ x: 600, y: 700, angle: 0 });
    let t = 1000;
    for (let i = 0; i < thrustFrames; i++) {
      stepTankMotion(tank, true, 0.04, map, DEFAULT_GAME_SETTINGS, t, { surface });
      t += 40;
    }
    const speedAtRelease = Math.hypot(tank.vx, tank.vy);
    const xAtRelease = tank.x;
    for (let i = 0; i < coastFrames; i++) {
      stepTankMotion(tank, false, 0.04, map, DEFAULT_GAME_SETTINGS, t, { surface });
      t += 40;
    }
    return { speedAtRelease, slide: tank.x - xAtRelease, speedAfter: Math.hypot(tank.vx, tank.vy) };
  };

  const normal = run('none', 20, 8);
  const sand = run('sand', 20, 8);
  const ice = run('ice', 20, 8);

  assert.ok(sand.speedAtRelease < normal.speedAtRelease * 0.6, 'sand is much slower');
  assert.ok(ice.speedAtRelease < normal.speedAtRelease, 'ice accelerates slowly');
  assert.ok(ice.slide > normal.slide + 20, 'ice keeps sliding after release');
  assert.ok(ice.speedAfter > 0 && normal.speedAfter === 0, 'ice does not stop instantly');
});

test('ice: changing heading while sliding keeps old momentum (skid)', () => {
  const map = ARENA_MAPS.glacier;
  const tank = makeTank({ x: 600, y: 700, angle: 0 });
  let t = 1000;
  for (let i = 0; i < 25; i++) {
    stepTankMotion(tank, true, 0.04, map, DEFAULT_GAME_SETTINGS, t, { surface: 'ice' });
    t += 40;
  }
  // Turn to face straight down, then drive: on ice vx must persist for a while
  tank.angle = Math.PI / 2;
  const vx0 = tank.vx;
  stepTankMotion(tank, true, 0.04, map, DEFAULT_GAME_SETTINGS, t, { surface: 'ice' });
  assert.ok(tank.vx > vx0 * 0.8, 'sideways velocity persists on ice');
});

test('stunned tanks cannot drive, rotate, or fire', () => {
  const map = ARENA_MAPS.dunes;
  const now = 5000;
  const tank = makeTank({ x: 600, y: 700, angle: 1, stunnedUntil: now + 1000 });
  stepTankMotion(tank, true, 0.1, map, DEFAULT_GAME_SETTINGS, now);
  assert.equal(tank.x, 600);
  assert.equal(tank.angle, 1);
  assert.equal(canTankFire(tank, now, DEFAULT_GAME_SETTINGS), false);

  stepTankMotion(tank, true, 0.1, map, DEFAULT_GAME_SETTINGS, now + 1500);
  assert.ok(tank.x > 600, 'moves again after stun expires');
  assert.equal(canTankFire(tank, now + 1500, DEFAULT_GAME_SETTINGS), true);
});

test('wind schedule is deterministic and bounded (legacy helper; no terrain map enables wind)', () => {
  const seed = 987654;
  let activeMs = 0;
  let gusts = 0;
  let wasActive = false;
  for (let ms = 0; ms < 300000; ms += 100) {
    const a = getWindAt(seed, ms);
    const b = getWindAt(seed, ms);
    assert.deepEqual(a, b);
    if (a.active) activeMs += 100;
    if (a.active && !wasActive) gusts += 1;
    wasActive = a.active;
    assert.ok(a.strength >= 0 && a.strength <= 1);
  }
  const share = activeMs / 300000;
  assert.ok(gusts >= 10, `gusts happen regularly (${gusts})`);
  assert.ok(share > 0.1 && share < 0.45, `gusts are intermittent, not constant (${share.toFixed(2)})`);
  assert.equal(getMapWindAt(ARENA_MAPS.dunes, seed, 7000).active, false);
  assert.equal(getMapWindAt(ARENA_MAPS.storm, seed, 7000).active, false); // area wind dumped
  assert.equal(getMapWindAt(ARENA_MAPS.dunes, seed, 7000).warning, false);

  // Every gust is telegraphed first
  for (let ms = 0; ms < 120000; ms += 50) {
    if (getWindAt(seed, ms).active && !getWindAt(seed, ms - 50).active) {
      assert.ok(getWindAt(seed, ms - 700).warning || getWindAt(seed, ms - 700).active, 'warning before gust');
    }
  }
});

function makeShell(overrides: Partial<ProjectileEntity> = {}): ProjectileEntity {
  return {
    id: 's1',
    ownerId: 'p1',
    team: 'none',
    x: 700,
    y: 700,
    vx: DEFAULT_GAME_SETTINGS.projectileSpeed,
    vy: 0,
    damage: 100,
    distanceTraveled: 0,
    maxRange: DEFAULT_GAME_SETTINGS.projectileRange,
    isDoubleDamage: false,
    ...overrides,
  };
}

test('wind bends a shell noticeably but never absurdly', () => {
  const map = ARENA_MAPS.dunes; // open lane so the shell flies its full range
  const accel = windAcceleration({ active: true, warning: false, angle: Math.PI / 2, strength: 1 });
  const shell = makeShell();
  let steps = 0;
  while (steps < 400) {
    const res = stepProjectile(shell, 0.04, map, [], accel);
    steps += 1;
    if (res.expired) break;
  }
  const lateral = Math.abs(shell.y - 700);
  assert.ok(lateral > 60, `peak wind visibly bends the shell (${lateral.toFixed(0)}px)`);
  assert.ok(lateral < 330, `but not extreme (${lateral.toFixed(0)}px)`);
  assert.equal(shell.windBent, true);
});

test('only wind-bent shells can hit their owner, and only after travelling away', () => {
  const map = ARENA_MAPS.storm;
  const owner = makeTank({ id: 'p1', x: 700, y: 700 });

  const straight = makeShell({ x: 740, y: 700, vx: -720, vy: 0 });
  const r1 = stepProjectile(straight, 0.04, map, [owner]);
  assert.equal(r1.hitTankId, null, 'normal shells never hit their owner');

  const bentEarly = makeShell({ x: 740, y: 700, vx: -720, vy: 0, windBent: true, distanceTraveled: 10 });
  const r2 = stepProjectile(bentEarly, 0.04, map, [owner]);
  assert.equal(r2.hitTankId, null, 'bent shells ignore the owner while still at the muzzle');

  const bentFar = makeShell({
    x: 740,
    y: 700,
    vx: -720,
    vy: 0,
    windBent: true,
    distanceTraveled: HAZARD_TUNING.windSelfHitMinDist + 50,
  });
  const r3 = stepProjectile(bentFar, 0.04, map, [owner]);
  assert.equal(r3.hitTankId, 'p1', 'a wind-bent shell that returned can hit its owner');
});

test('wind self-damage is scaled down so it cannot one-shot at default damage', () => {
  const victim = makeTank({ hp: 100 });
  const dmg = DEFAULT_GAME_SETTINGS.projectileDamage * HAZARD_TUNING.windSelfDamageMul;
  const res = applyEnvironmentDamage(victim, dmg, 10_000);
  assert.equal(res.eliminated, false);
  assert.ok(res.appliedDamage > 0 && res.appliedDamage < 50);
});

test('environment damage respects spawn invincibility and shields', () => {
  const protectedTank = makeTank({ invincibleUntil: 20_000 });
  assert.equal(applyEnvironmentDamage(protectedTank, 40, 10_000).appliedDamage, 0);
  const shielded = makeTank({ activePowerUps: [{ type: 'shield', expiresAt: 30_000, durationMs: 8000 }] });
  assert.equal(applyEnvironmentDamage(shielded, 40, 10_000).appliedDamage, 0);
  const exposed = makeTank({ hp: 30 });
  const res = applyEnvironmentDamage(exposed, 40, 10_000);
  assert.equal(res.eliminated, true);
  assert.equal(exposed.alive, false);
});

test('stun bombs: deterministic, infrequent, never at the center or on spawns', () => {
  const map = ARENA_MAPS.blastyard;
  const seed = 424242;
  let count = 0;
  const epochs = 40;
  for (let e = 0; e < epochs; e++) {
    const a = getBombForEpoch(map, seed, e);
    const b = getBombForEpoch(map, seed, e);
    assert.deepEqual(a, b);
    if (!a) continue;
    count += 1;
    assert.ok(a.armAt >= e * HAZARD_TUNING.bombEpochMs + HAZARD_TUNING.bombOffsetMinMs);
    assert.ok(a.detonateAt - a.armAt === HAZARD_TUNING.bombTelegraphMs, 'telegraphed before detonation');
    assert.ok(
      Math.abs(a.x - map.width / 2) >= 260 || Math.abs(a.y - map.height / 2) >= 200,
      'not in the center'
    );
    for (const sp of [...map.ffaSpawns, ...map.redSpawns, ...map.blueSpawns]) {
      assert.ok(Math.hypot(sp.x - a.x, sp.y - a.y) > HAZARD_TUNING.bombRadius, 'does not cover a spawn');
    }
  }
  assert.ok(count >= epochs * 0.7 && count <= epochs, `at most one bomb per ${HAZARD_TUNING.bombEpochMs}ms`);
  assert.ok(HAZARD_TUNING.bombEpochMs >= 12000, 'not annoyingly frequent');

  const bomb = getBombForEpoch(map, seed, 1)!;
  assert.equal(getActiveBomb(map, seed, bomb.armAt - 10), null);
  assert.equal(getActiveBomb(map, seed, bomb.armAt + 10)?.id, bomb.id);
  assert.equal(getActiveBomb(ARENA_MAPS.dunes, seed, bomb.armAt + 10), null);
});

test('beta map tanks have enough room: spawn points are outside tank radius of every hazard-free wall', () => {
  for (const id of BETA_MAP_IDS) {
    const map = ARENA_MAPS[id];
    for (const sp of [...map.ffaSpawns, ...map.redSpawns, ...map.blueSpawns]) {
      for (const o of map.obstacles) {
        assert.equal(circleIntersectsRect(sp.x, sp.y, TANK_RADIUS + 4, o), false);
      }
    }
  }
});
