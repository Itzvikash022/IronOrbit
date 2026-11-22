// Patches terrain map obstacle data into gen-beta-maps source by regenerating betaMaps.ts terrain entries.
// Reads curated obstacles + existing MAPS metadata from gen-beta-maps.mjs pattern via JSON side file.
import fs from 'node:fs';

const W = 2880;
const H = 1440;
const TANK_RADIUS = 20;
const CRATE_RADIUS = 18;
const obstaclesById = JSON.parse(fs.readFileSync('scripts/terrain-obstacles-curated.json', 'utf8'));

// Obstacles come straight from scripts/refine-colliders.mjs (painted rocks only).
// Spawns / crates / bases are nudged to free ground instead of deleting painted rocks.
const clearance = (cx, cy, obstacles) =>
  obstacles.reduce((m, o) => Math.min(m, circleRectDist(cx, cy, o)), Infinity);

function nudgeToFree(p, obstacles, need) {
  if (clearance(p.x, p.y, obstacles) >= need) return p;
  for (let r = 12; r <= 600; r += 12) {
    for (let a = 0; a < 360; a += 15) {
      const x = Math.round(p.x + Math.cos((a * Math.PI) / 180) * r);
      const y = Math.round(p.y + Math.sin((a * Math.PI) / 180) * r);
      if (x < 60 || y < 60 || x > W - 60 || y > H - 60) continue;
      if (clearance(x, y, obstacles) >= need) return { x, y };
    }
  }
  return p;
}

const STD_RED_BASE = { x: 224, y: 720, radius: 68 };
const STD_BLUE_BASE = { x: W - 224, y: 720, radius: 68 };
const mirrorPt = (p) => ({ x: W - p.x, y: p.y });
const STD_RED_SPAWNS = [
  { x: 192, y: 432 },
  { x: 192, y: 1008 },
  { x: 368, y: 216 },
  { x: 400, y: 1180 },
];
const STD_FFA = [
  { x: 240, y: 180 },
  { x: W - 240, y: 180 },
  { x: 240, y: 1260 },
  { x: W - 240, y: 1260 },
  { x: 1440, y: 150 },
  { x: 1440, y: 1320 },
  { x: 700, y: 700 },
  { x: W - 700, y: 700 },
];
const STD_CRATES = [
  { x: 1440, y: 360 },
  { x: 1440, y: 1080 },
  { x: 900, y: 720 },
  { x: W - 900, y: 720 },
  { x: 900, y: 240 },
  { x: W - 900, y: 1200 },
  { x: W - 900, y: 240 },
  { x: 900, y: 1200 },
];

function circleRectDist(cx, cy, r) {
  const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
  return Math.hypot(cx - nx, cy - ny);
}

function validate(map) {
  const errors = [];
  for (const o of map.obstacles) {
    if (o.x < 0 || o.y < 0 || o.x + o.w > W || o.y + o.h > H) errors.push(`${o.id} OOB`);
    for (const base of [map.redBase, map.blueBase]) {
      if (circleRectDist(base.x, base.y, o) < base.radius + TANK_RADIUS + 6) errors.push(`${o.id} base`);
    }
  }
  for (const p of [...map.ffaSpawns, ...map.redSpawns, ...map.blueSpawns]) {
    for (const o of map.obstacles) {
      if (circleRectDist(p.x, p.y, o) < TANK_RADIUS + 4) errors.push(`spawn/${o.id}`);
    }
  }
  for (const c of map.crateZones) {
    for (const o of map.obstacles) {
      if (circleRectDist(c.x, c.y, o) < CRATE_RADIUS + 10) errors.push(`crate/${o.id}`);
    }
  }
  return errors;
}

const META = {
  dunes: {
    name: 'Dune Sea',
    subtitle: 'Collect 3 sand charges to slow the enemy team',
    category: 'terrain',
    terrainUlt: 'slow',
    palette: {
      groundBase: '#d8b878',
      groundDetail: '#c9a560',
      groundAccent: '#e6c98f',
      gridLine: 'rgba(120, 80, 30, 0.10)',
      obstacleFill: '#9a6b3c',
      obstacleStroke: '#4a2e14',
      obstacleTop: '#b98a55',
      ambientEffect: 'dust',
    },
  },
  glacier: {
    name: 'Glacier Rift',
    subtitle: 'Collect 3 ice charges to freeze the enemy team',
    category: 'terrain',
    terrainUlt: 'freeze',
    palette: {
      groundBase: '#bfe3f2',
      groundDetail: '#a9d3e6',
      groundAccent: '#e4f6ff',
      gridLine: 'rgba(30, 90, 130, 0.12)',
      obstacleFill: '#6fa8c9',
      obstacleStroke: '#1f4a66',
      obstacleTop: '#a5d4ec',
      ambientEffect: 'snow',
    },
  },
  magma: {
    name: 'Magma Fields',
    subtitle: 'Collect 3 magma charges to burn the enemy team',
    category: 'terrain',
    terrainUlt: 'burn',
    palette: {
      groundBase: '#2a1612',
      groundDetail: '#1f0f0c',
      groundAccent: '#3d1f17',
      gridLine: 'rgba(255, 120, 60, 0.07)',
      obstacleFill: '#4a2f2a',
      obstacleStroke: '#140807',
      obstacleTop: '#7a3d2c',
      ambientEffect: 'embers',
    },
  },
  storm: {
    name: 'Storm Plateau',
    subtitle: 'Collect 3 storm charges to shield your team from shells',
    category: 'terrain',
    terrainUlt: 'gust_shield',
    palette: {
      groundBase: '#7d8a6a',
      groundDetail: '#6c7a5b',
      groundAccent: '#93a07e',
      gridLine: 'rgba(30, 40, 20, 0.12)',
      obstacleFill: '#5b6070',
      obstacleStroke: '#23262f',
      obstacleTop: '#7f8598',
      ambientEffect: 'dust',
    },
  },
};

function pickBases(obstacles) {
  const need = STD_RED_BASE.radius + TANK_RADIUS + 6;
  for (let d = 0; d <= 500; d += 20) {
    for (const dy of d === 0 ? [0] : [-d, d]) {
      const y = STD_RED_BASE.y + dy;
      if (
        clearance(STD_RED_BASE.x, y, obstacles) >= need &&
        clearance(STD_BLUE_BASE.x, y, obstacles) >= need
      ) {
        return {
          redBase: { ...STD_RED_BASE, y },
          blueBase: { ...STD_BLUE_BASE, y },
        };
      }
    }
  }
  return { redBase: STD_RED_BASE, blueBase: STD_BLUE_BASE };
}

// Load existing betaMaps and replace only terrain maps; keep obstacle maps as-is
const existingPath = 'src/shared/betaMaps.ts';
const existingMod = await import('../src/shared/betaMaps.ts');
const BETA = { ...existingMod.BETA_MAPS };

for (const id of Object.keys(META)) {
  const meta = META[id];
  const map = {
    id,
    name: meta.name,
    subtitle: meta.subtitle,
    width: W,
    height: H,
    palette: meta.palette,
    obstacles: obstaclesById[id],
    ffaSpawns: STD_FFA.map((p) => nudgeToFree(p, obstaclesById[id], TANK_RADIUS + 10)),
    redSpawns: STD_RED_SPAWNS.map((p) => nudgeToFree(p, obstaclesById[id], TANK_RADIUS + 10)),
    blueSpawns: STD_RED_SPAWNS.map(mirrorPt).map((p) => nudgeToFree(p, obstaclesById[id], TANK_RADIUS + 10)),
    ...pickBases(obstaclesById[id]),
    crateZones: STD_CRATES.map((p) => nudgeToFree(p, obstaclesById[id], CRATE_RADIUS + 14)),
    category: 'terrain',
    beta: true,
    bakedFloor: true,
    hazardSpec: { terrainUlt: meta.terrainUlt },
  };
  const errors = validate(map);
  if (errors.length) {
    console.error(id, errors);
    // drop conflicting obstacles
    map.obstacles = map.obstacles.filter((o) => {
      const probe = { ...map, obstacles: [o] };
      return validate(probe).length === 0;
    });
    const e2 = validate(map);
    if (e2.length) {
      console.error(id, 'still', e2);
      process.exit(1);
    }
    console.log(id, 'dropped conflicts, left', map.obstacles.length);
  }
  BETA[id] = map;
}

const body = JSON.stringify(BETA, null, 2)
  .replace(/"([A-Za-z_][A-Za-z0-9_]*)":/g, '$1:')
  .replace(/"/g, "'");

const out =
  `// AUTO-GENERATED — terrain floors use public/maps/*.png; obstacles synced from art.\n` +
  `// Obstacle maps still seeded for turrets/grass/bombs via hazards.ts.\n` +
  `import type { ArenaMap, BetaMapId } from './types.ts';\n\n` +
  `export const BETA_MAPS: Record<BetaMapId, ArenaMap> = ${body};\n`;

fs.writeFileSync(existingPath, out);
console.log('updated', existingPath, 'terrain obstacles:', Object.fromEntries(['dunes','glacier','magma','storm'].map(id => [id, BETA[id].obstacles.length])));
