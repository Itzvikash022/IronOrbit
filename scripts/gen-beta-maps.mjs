// Generates src/shared/betaMaps.ts (7 beta maps, 2880x1440).
// Usage: node scripts/gen-beta-maps.mjs
// Layouts are authored for the LEFT half and mirrored to the right so every map is fair
// for red/blue. Hazards (sand/ice/lava/grass zones, wind, bombs, turrets) are NOT baked in:
// they are generated per match from a seed by src/shared/hazards.ts.
import fs from 'node:fs';

const W = 2880;
const H = 1440;
const TANK_RADIUS = 20;
const CRATE_RADIUS = 18;

const STD_RED_BASE = { x: 224, y: 720, radius: 68 };
const STD_BLUE_BASE = { x: W - 224, y: 720, radius: 68 };

const mirrorPt = (p) => ({ x: W - p.x, y: p.y });

const STD_RED_SPAWNS = [
  { x: 192, y: 432 },
  { x: 192, y: 1008 },
  { x: 368, y: 216 },
  { x: 368, y: 1224 },
];
const STD_FFA = [
  { x: 240, y: 180 },
  { x: W - 240, y: 180 },
  { x: 240, y: 1260 },
  { x: W - 240, y: 1260 },
  { x: 1440, y: 168 },
  { x: 1440, y: 1272 },
  { x: 768, y: 720 },
  { x: W - 768, y: 720 },
];
const STD_CRATES = [
  { x: 1440, y: 384 },
  { x: 1440, y: 1056 },
  { x: 832, y: 720 },
  { x: W - 832, y: 720 },
  { x: 832, y: 216 },
  { x: W - 832, y: 1224 },
  { x: W - 832, y: 216 },
  { x: 832, y: 1224 },
];

/** left: [x,y,w,h,kind] authored for x < W/2; center: self-symmetric extras */
function buildObstacles(prefix, left, center = []) {
  const out = [];
  let n = 1;
  for (const [x, y, w, h, kind] of left) {
    out.push({ id: `${prefix}${n++}`, x, y, w, h, kind });
    out.push({ id: `${prefix}${n++}`, x: W - x - w, y, w, h, kind });
  }
  for (const [x, y, w, h, kind] of center) {
    out.push({ id: `${prefix}${n++}`, x, y, w, h, kind });
  }
  return out;
}

const MAPS = [
  {
    id: 'dunes',
    name: 'Dune Sea',
    subtitle: 'Collect 3 sand charges to slow the enemy team',
    category: 'terrain',
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
    hazardSpec: { terrainUlt: 'slow' },
    left: [
      [480, 330, 130, 110, 'rock'],
      [540, 1010, 150, 120, 'rock'],
      [960, 190, 170, 90, 'ruin'],
      [1000, 560, 90, 170, 'ruin'],
      [1060, 1080, 120, 100, 'rock'],
      [420, 640, 70, 160, 'sandbag'],
    ],
    center: [
      [1350, 1150, 180, 70, 'ruin'],
      [1350, 220, 180, 70, 'ruin'],
    ],
  },
  {
    id: 'glacier',
    name: 'Glacier Rift',
    subtitle: 'Collect 3 ice charges to freeze the enemy team',
    category: 'terrain',
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
    hazardSpec: { terrainUlt: 'freeze' },
    left: [
      [520, 360, 60, 220, 'ice_wall'],
      [520, 860, 60, 220, 'ice_wall'],
      [880, 300, 220, 60, 'ice_wall'],
      [880, 1080, 220, 60, 'ice_wall'],
      [1000, 620, 110, 110, 'rock'],
      [1180, 1000, 100, 100, 'rock'],
    ],
    center: [
      [1400, 520, 80, 120, 'ice_wall'],
      [1400, 800, 80, 120, 'ice_wall'],
    ],
  },
  {
    id: 'magma',
    name: 'Magma Fields',
    subtitle: 'Collect 3 magma charges to burn the enemy team',
    category: 'terrain',
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
    hazardSpec: { terrainUlt: 'burn' },
    left: [
      [500, 420, 90, 90, 'lava_pillar'],
      [500, 930, 90, 90, 'lava_pillar'],
      [760, 280, 120, 90, 'rock'],
      [760, 1060, 120, 110, 'rock'],
      [1000, 640, 80, 160, 'lava_pillar'],
      [1180, 300, 150, 90, 'rock'],
      [1180, 1050, 150, 90, 'rock'],
    ],
    center: [],
  },
  {
    id: 'storm',
    name: 'Storm Plateau',
    subtitle: 'Collect 3 storm charges to shield your team from shells',
    category: 'terrain',
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
    hazardSpec: { terrainUlt: 'gust_shield' },
    left: [
      [560, 300, 200, 50, 'barrier'],
      [560, 1090, 200, 50, 'barrier'],
      [900, 420, 130, 130, 'ruin'],
      [900, 890, 130, 130, 'ruin'],
      [1160, 640, 100, 160, 'rock'],
      [440, 640, 50, 160, 'barrier'],
      [1250, 190, 130, 100, 'ruin'],
      [1250, 1150, 130, 100, 'ruin'],
    ],
    center: [],
  },
  {
    id: 'sentinel',
    name: 'Sentinel Yard',
    subtitle: 'Fortified compound — wall-mounted turrets watch every lane',
    category: 'obstacle',
    palette: {
      groundBase: '#3a424d',
      groundDetail: '#2f363f',
      groundAccent: '#4c5663',
      gridLine: 'rgba(255, 255, 255, 0.06)',
      obstacleFill: '#59616e',
      obstacleStroke: '#171b21',
      obstacleTop: '#7a8494',
      ambientEffect: 'sparks',
    },
    hazardSpec: { turrets: [4, 5] },
    left: [
      [520, 240, 210, 110, 'building'],
      [520, 1090, 210, 110, 'building'],
      [890, 420, 140, 160, 'bunker'],
      [890, 860, 140, 160, 'bunker'],
      [1120, 180, 50, 210, 'barrier'],
      [1120, 1050, 50, 210, 'barrier'],
      [1180, 630, 150, 180, 'bunker'],
      [420, 620, 50, 200, 'barrier'],
    ],
    center: [],
  },
  {
    id: 'overgrowth',
    name: 'Overgrowth',
    subtitle: 'Overgrown ruins — tall grass hides tanks that stay low',
    category: 'obstacle',
    palette: {
      groundBase: '#2f5a34',
      groundDetail: '#264c2b',
      groundAccent: '#3f7344',
      gridLine: 'rgba(0, 0, 0, 0.10)',
      obstacleFill: '#6b4a2b',
      obstacleStroke: '#2a1a0c',
      obstacleTop: '#8a6238',
      ambientEffect: 'leaves',
    },
    hazardSpec: {
      surfaces: [{ kind: 'grass', count: [7, 10], rx: [110, 220], ry: [90, 170] }],
    },
    left: [
      [480, 300, 100, 100, 'tree'],
      [600, 980, 110, 110, 'tree'],
      [740, 440, 100, 100, 'tree'],
      [960, 560, 150, 150, 'ruin'],
      [960, 220, 100, 100, 'tree'],
      [1020, 1090, 100, 100, 'tree'],
      [440, 635, 80, 170, 'ruin'],
      [1200, 360, 90, 90, 'tree'],
      [1200, 990, 90, 90, 'tree'],
    ],
    center: [],
  },
  {
    id: 'blastyard',
    name: 'Blast Yard',
    subtitle: 'Scrapyard rigged with demolition charges that go off at random',
    category: 'obstacle',
    palette: {
      groundBase: '#4a4338',
      groundDetail: '#3e382f',
      groundAccent: '#5d5547',
      gridLine: 'rgba(255, 200, 120, 0.06)',
      obstacleFill: '#8a5a2b',
      obstacleStroke: '#241a0e',
      obstacleTop: '#b87a3a',
      ambientEffect: 'ash',
    },
    hazardSpec: { bombs: true },
    left: [
      [520, 260, 200, 80, 'container'],
      [520, 1100, 200, 80, 'container'],
      [860, 430, 150, 100, 'wreck'],
      [860, 910, 150, 100, 'wreck'],
      [1080, 610, 90, 220, 'machinery'],
      [1180, 250, 170, 80, 'container'],
      [1180, 1110, 170, 80, 'container'],
      [420, 620, 70, 200, 'sandbag'],
    ],
    center: [],
  },
];

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function circleRectDist(cx, cy, r) {
  const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
  return Math.hypot(cx - nx, cy - ny);
}

function rectGap(a, b) {
  const dx = Math.max(a.x - (b.x + b.w), b.x - (a.x + a.w), 0);
  const dy = Math.max(a.y - (b.y + b.h), b.y - (a.y + a.h), 0);
  return Math.hypot(dx, dy);
}

const errors = [];
function validate(m) {
  const tag = (s) => `[${m.id}] ${s}`;
  for (const o of m.obstacles) {
    if (o.x < 0 || o.y < 0 || o.x + o.w > W || o.y + o.h > H) errors.push(tag(`${o.id} out of bounds`));
    for (const base of [m.redBase, m.blueBase]) {
      if (circleRectDist(base.x, base.y, o) < base.radius + TANK_RADIUS + 10) {
        errors.push(tag(`${o.id} overlaps base`));
      }
    }
  }
  const spawnGroups = { red: m.redSpawns, blue: m.blueSpawns, ffa: m.ffaSpawns };
  for (const [g, pts] of Object.entries(spawnGroups)) {
    for (const p of pts) {
      for (const o of m.obstacles) {
        if (circleRectDist(p.x, p.y, o) < TANK_RADIUS + 8) errors.push(tag(`${g} spawn (${p.x},${p.y}) blocked by ${o.id}`));
      }
    }
  }
  for (const c of m.crateZones) {
    for (const o of m.obstacles) {
      if (circleRectDist(c.x, c.y, o) < CRATE_RADIUS + 14) errors.push(tag(`crate (${c.x},${c.y}) blocked by ${o.id}`));
    }
  }
  for (let i = 0; i < m.obstacles.length; i++) {
    for (let j = i + 1; j < m.obstacles.length; j++) {
      const g = rectGap(m.obstacles[i], m.obstacles[j]);
      if (g < 60) errors.push(tag(`${m.obstacles[i].id} / ${m.obstacles[j].id} gap ${g.toFixed(0)} < 60`));
    }
  }
}

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------

const built = {};
for (const def of MAPS) {
  const prefix = def.id.slice(0, 2);
  const map = {
    id: def.id,
    name: def.name,
    subtitle: def.subtitle,
    width: W,
    height: H,
    palette: def.palette,
    obstacles: buildObstacles(prefix, def.left, def.center),
    ffaSpawns: STD_FFA,
    redSpawns: STD_RED_SPAWNS,
    blueSpawns: STD_RED_SPAWNS.map(mirrorPt),
    redBase: STD_RED_BASE,
    blueBase: STD_BLUE_BASE,
    crateZones: STD_CRATES,
    category: def.category,
    beta: true,
    hazardSpec: def.hazardSpec,
  };
  validate(map);
  built[def.id] = map;
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const body = JSON.stringify(built, null, 2)
  .replace(/"([A-Za-z_][A-Za-z0-9_]*)":/g, '$1:')
  .replace(/"/g, "'");

const out =
  `// AUTO-GENERATED by scripts/gen-beta-maps.mjs — do not edit by hand.\n` +
  `// Hazards (sand/ice/lava/grass zones, wind, bombs, turrets) are seeded per match in hazards.ts.\n` +
  `import type { ArenaMap, BetaMapId } from './types.ts';\n\n` +
  `export const BETA_MAPS: Record<BetaMapId, ArenaMap> = ${body};\n`;

fs.writeFileSync('src/shared/betaMaps.ts', out);
console.log(`wrote betaMaps.ts (${Object.keys(built).length} maps)`);
