import fs from 'fs';
import { pathToFileURL } from 'url';

const OLD_W = 1800;
const NEW_W = 2880;
const H = 1200;
const SX = NEW_W / OLD_W;
const sx = (n) => Math.round(n * SX);

/** Original layouts only (pre-widen). Extra cover is added after scale in clear side lanes. */
const raw = {
  desert: {
    name: 'Desert Arena',
    subtitle: 'Sun-scorched canyon ruins & sandstone monoliths',
    palette: {
      groundBase: '#c29b61',
      groundDetail: '#b0874e',
      groundAccent: '#d6b37c',
      gridLine: 'rgba(110, 74, 30, 0.14)',
      obstacleFill: '#8b5e34',
      obstacleStroke: '#4a2e14',
      obstacleTop: '#a47549',
      ambientEffect: 'dust',
    },
    obstacles: [
      ['d1', 340, 220, 150, 70, 'ruin'],
      ['d2', 1310, 220, 150, 70, 'ruin'],
      ['d3', 340, 910, 150, 70, 'ruin'],
      ['d4', 1310, 910, 150, 70, 'ruin'],
      ['d5', 640, 390, 110, 110, 'rock'],
      ['d6', 1050, 390, 110, 110, 'rock'],
      ['d7', 640, 700, 110, 110, 'rock'],
      ['d8', 1050, 700, 110, 110, 'rock'],
      ['d9', 840, 540, 120, 120, 'ruin'],
      ['d10', 260, 520, 70, 160, 'sandbag'],
      ['d11', 1470, 520, 70, 160, 'sandbag'],
    ],
    extras: [
      ['d12', 800, 280, 100, 70, 'rock'],
      ['d13', 1980, 280, 100, 70, 'rock'],
      ['d14', 800, 850, 100, 70, 'rock'],
      ['d15', 1980, 850, 100, 70, 'rock'],
    ],
    redBase: [140, 600, 68],
    blueBase: [1660, 600, 68],
    redSpawns: [
      [120, 360],
      [120, 840],
      [230, 180],
      [230, 1020],
    ],
    blueSpawns: [
      [1680, 360],
      [1680, 840],
      [1570, 180],
      [1570, 1020],
    ],
    ffaSpawns: [
      [150, 150],
      [1650, 150],
      [150, 1050],
      [1650, 1050],
      [900, 140],
      [900, 1060],
      [480, 600],
      [1320, 600],
    ],
    crateZones: [
      [900, 320],
      [900, 880],
      [520, 600],
      [1280, 600],
      [520, 180],
      [1280, 1020],
      [1280, 180],
      [520, 1020],
    ],
  },
  industrial: {
    name: 'Industrial Zone',
    subtitle: 'Heavy freight containers, blast corridors & gantry bays',
    palette: {
      groundBase: '#333b44',
      groundDetail: '#2a3139',
      groundAccent: '#46505c',
      gridLine: 'rgba(255, 255, 255, 0.06)',
      obstacleFill: '#b45309',
      obstacleStroke: '#1e293b',
      obstacleTop: '#d97706',
      ambientEffect: 'sparks',
    },
    obstacles: [
      ['i1', 320, 170, 180, 70, 'container'],
      ['i2', 320, 960, 180, 70, 'container'],
      ['i3', 1300, 170, 180, 70, 'container'],
      ['i4', 1300, 960, 180, 70, 'container'],
      ['i5', 560, 380, 75, 190, 'machinery'],
      ['i6', 1165, 630, 75, 190, 'machinery'],
      ['i7', 560, 690, 160, 70, 'container'],
      ['i8', 1080, 440, 160, 70, 'container'],
      ['i9', 855, 210, 90, 140, 'machinery'],
      ['i10', 855, 850, 90, 140, 'machinery'],
      ['i11', 840, 550, 120, 100, 'container'],
    ],
    extras: [
      ['i12', 800, 280, 140, 60, 'container'],
      ['i13', 1940, 280, 140, 60, 'container'],
      ['i14', 800, 860, 140, 60, 'container'],
      ['i15', 1940, 860, 140, 60, 'container'],
    ],
    redBase: [140, 600, 68],
    blueBase: [1660, 600, 68],
    redSpawns: [
      [140, 260],
      [140, 940],
      [250, 420],
      [250, 780],
    ],
    blueSpawns: [
      [1660, 260],
      [1660, 940],
      [1550, 420],
      [1550, 780],
    ],
    ffaSpawns: [
      [140, 140],
      [1660, 140],
      [140, 1060],
      [1660, 1060],
      [900, 110],
      [900, 1090],
      [430, 600],
      [1370, 600],
    ],
    crateZones: [
      [900, 430],
      [900, 770],
      [430, 310],
      [1370, 890],
      [1370, 310],
      [430, 890],
      [730, 600],
      [1070, 600],
    ],
  },
  forest: {
    name: 'Forest Battlefield',
    subtitle: 'Dense timber cover, mossy clearings & log barricades',
    palette: {
      groundBase: '#3c5a37',
      groundDetail: '#314b2d',
      groundAccent: '#4f7348',
      gridLine: 'rgba(20, 40, 18, 0.14)',
      obstacleFill: '#5c4033',
      obstacleStroke: '#291c15',
      obstacleTop: '#2d6a4f',
      ambientEffect: 'leaves',
    },
    obstacles: [
      ['f1', 350, 220, 96, 96, 'tree'],
      ['f2', 1354, 220, 96, 96, 'tree'],
      ['f3', 350, 884, 96, 96, 'tree'],
      ['f4', 1354, 884, 96, 96, 'tree'],
      ['f5', 560, 540, 120, 120, 'barrier'],
      ['f6', 1120, 540, 120, 120, 'barrier'],
      ['f7', 850, 310, 100, 100, 'tree'],
      ['f8', 850, 790, 100, 100, 'tree'],
      ['f9', 640, 200, 140, 64, 'barrier'],
      ['f10', 1020, 936, 140, 64, 'barrier'],
      ['f11', 1020, 200, 140, 64, 'barrier'],
      ['f12', 640, 936, 140, 64, 'barrier'],
    ],
    extras: [
      ['f13', 800, 480, 90, 90, 'tree'],
      ['f14', 1990, 480, 90, 90, 'tree'],
      ['f15', 800, 700, 90, 90, 'tree'],
      ['f16', 1990, 700, 90, 90, 'tree'],
    ],
    redBase: [145, 600, 68],
    blueBase: [1655, 600, 68],
    redSpawns: [
      [140, 280],
      [140, 920],
      [260, 450],
      [260, 750],
    ],
    blueSpawns: [
      [1660, 280],
      [1660, 920],
      [1540, 450],
      [1540, 750],
    ],
    ffaSpawns: [
      [160, 160],
      [1640, 160],
      [160, 1040],
      [1640, 1040],
      [900, 140],
      [900, 1060],
      [380, 600],
      [1420, 600],
    ],
    crateZones: [
      [900, 600],
      [900, 160],
      [900, 1040],
      [520, 360],
      [1280, 360],
      [520, 840],
      [1280, 840],
    ],
  },
  frozen: {
    name: 'Frozen Base',
    subtitle: 'Glacial ice sheet, cryo-vaults & frost battlements',
    palette: {
      groundBase: '#9ec5d8',
      groundDetail: '#87b3ca',
      groundAccent: '#c4e1ef',
      gridLine: 'rgba(15, 55, 85, 0.12)',
      obstacleFill: '#4f86a6',
      obstacleStroke: '#1e3a5f',
      obstacleTop: '#dbeafe',
      ambientEffect: 'snow',
    },
    obstacles: [
      ['z1', 370, 360, 90, 170, 'ice_wall'],
      ['z2', 370, 670, 90, 170, 'ice_wall'],
      ['z3', 1340, 360, 90, 170, 'ice_wall'],
      ['z4', 1340, 670, 90, 170, 'ice_wall'],
      ['z5', 790, 520, 220, 160, 'bunker'],
      ['z6', 640, 200, 130, 75, 'ice_wall'],
      ['z7', 1030, 200, 130, 75, 'ice_wall'],
      ['z8', 640, 925, 130, 75, 'ice_wall'],
      ['z9', 1030, 925, 130, 75, 'ice_wall'],
    ],
    extras: [
      ['z10', 800, 280, 120, 60, 'ice_wall'],
      ['z11', 1960, 280, 120, 60, 'ice_wall'],
      ['z12', 800, 860, 120, 60, 'ice_wall'],
      ['z13', 1960, 860, 120, 60, 'ice_wall'],
    ],
    redBase: [140, 600, 68],
    blueBase: [1660, 600, 68],
    redSpawns: [
      [140, 260],
      [140, 940],
      [240, 420],
      [240, 780],
    ],
    blueSpawns: [
      [1660, 260],
      [1660, 940],
      [1560, 420],
      [1560, 780],
    ],
    ffaSpawns: [
      [150, 150],
      [1650, 150],
      [150, 1050],
      [1650, 1050],
      [900, 120],
      [900, 1080],
      [560, 600],
      [1240, 600],
    ],
    crateZones: [
      [900, 350],
      [900, 850],
      [580, 600],
      [1220, 600],
      [410, 190],
      [1390, 190],
      [410, 1010],
      [1390, 1010],
    ],
  },
  city: {
    name: 'Ruined City',
    subtitle: 'Shattered boulevards, bombed blocks & armored wrecks',
    palette: {
      groundBase: '#474c54',
      groundDetail: '#3a3f47',
      groundAccent: '#646b75',
      gridLine: 'rgba(255, 255, 255, 0.07)',
      obstacleFill: '#6b7280',
      obstacleStroke: '#1f2937',
      obstacleTop: '#9ca3af',
      ambientEffect: 'ash',
    },
    obstacles: [
      ['c1', 340, 200, 200, 130, 'building'],
      ['c2', 1260, 200, 200, 130, 'building'],
      ['c3', 340, 870, 200, 130, 'building'],
      ['c4', 1260, 870, 200, 130, 'building'],
      ['c5', 770, 260, 260, 80, 'building'],
      ['c6', 770, 860, 260, 80, 'building'],
      ['c7', 640, 540, 95, 120, 'wreck'],
      ['c8', 1065, 540, 95, 120, 'wreck'],
      ['c9', 260, 555, 70, 90, 'wreck'],
      ['c10', 1470, 555, 70, 90, 'wreck'],
    ],
    extras: [
      ['c11', 800, 300, 140, 70, 'building'],
      ['c12', 1940, 300, 140, 70, 'building'],
      ['c13', 800, 830, 140, 70, 'building'],
      ['c14', 1940, 830, 140, 70, 'building'],
    ],
    redBase: [135, 600, 68],
    blueBase: [1665, 600, 68],
    redSpawns: [
      [140, 260],
      [140, 940],
      [220, 420],
      [220, 780],
    ],
    blueSpawns: [
      [1660, 260],
      [1660, 940],
      [1580, 420],
      [1580, 780],
    ],
    ffaSpawns: [
      [150, 140],
      [1650, 140],
      [150, 1060],
      [1650, 1060],
      [900, 130],
      [900, 1070],
      [460, 600],
      [1340, 600],
    ],
    crateZones: [
      [900, 600],
      [900, 420],
      [900, 780],
      [660, 170],
      [1140, 1030],
      [1140, 170],
      [660, 1030],
    ],
  },
  outpost: {
    name: 'Military Outpost',
    subtitle: 'Reinforced concrete bunkers, perimeter walls & choke points',
    palette: {
      groundBase: '#4f5848',
      groundDetail: '#41493b',
      groundAccent: '#636e5a',
      gridLine: 'rgba(20, 26, 18, 0.16)',
      obstacleFill: '#64705e',
      obstacleStroke: '#1f241c',
      obstacleTop: '#84947c',
      ambientEffect: 'none',
    },
    obstacles: [
      ['o1', 460, 240, 120, 120, 'bunker'],
      ['o2', 1220, 240, 120, 120, 'bunker'],
      ['o3', 460, 840, 120, 120, 'bunker'],
      ['o4', 1220, 840, 120, 120, 'bunker'],
      ['o5', 830, 460, 140, 75, 'sandbag'],
      ['o6', 830, 665, 140, 75, 'sandbag'],
      ['o7', 260, 450, 64, 300, 'barrier'],
      ['o8', 1476, 450, 64, 300, 'barrier'],
      ['o9', 690, 160, 420, 55, 'barrier'],
      ['o10', 690, 985, 420, 55, 'barrier'],
    ],
    extras: [
      ['o11', 820, 300, 100, 70, 'sandbag'],
      ['o12', 1960, 300, 100, 70, 'sandbag'],
      ['o13', 820, 830, 100, 70, 'sandbag'],
      ['o14', 1960, 830, 100, 70, 'sandbag'],
    ],
    redBase: [140, 600, 68],
    blueBase: [1660, 600, 68],
    redSpawns: [
      [130, 240],
      [130, 960],
      [360, 420],
      [360, 780],
    ],
    blueSpawns: [
      [1670, 240],
      [1670, 960],
      [1440, 420],
      [1440, 780],
    ],
    ffaSpawns: [
      [150, 140],
      [1650, 140],
      [150, 1060],
      [1650, 1060],
      [900, 95],
      [900, 1105],
      [660, 600],
      [1140, 600],
    ],
    crateZones: [
      [900, 600],
      [900, 310],
      [900, 890],
      [660, 420],
      [1140, 780],
      [1140, 420],
      [660, 780],
    ],
  },
  lava: {
    name: 'Lava Arena',
    subtitle: 'Volcanic basalt plates, obsidian pillars & magma fissures',
    palette: {
      groundBase: '#271c1c',
      groundDetail: '#1c1313',
      groundAccent: '#ea580c',
      gridLine: 'rgba(249, 115, 22, 0.14)',
      obstacleFill: '#3f2e2e',
      obstacleStroke: '#7c2d12',
      obstacleTop: '#574141',
      ambientEffect: 'embers',
    },
    obstacles: [
      ['l1', 360, 240, 110, 110, 'lava_pillar'],
      ['l2', 1330, 240, 110, 110, 'lava_pillar'],
      ['l3', 360, 850, 110, 110, 'lava_pillar'],
      ['l4', 1330, 850, 110, 110, 'lava_pillar'],
      ['l5', 640, 420, 95, 95, 'rock'],
      ['l6', 1065, 420, 95, 95, 'rock'],
      ['l7', 640, 685, 95, 95, 'rock'],
      ['l8', 1065, 685, 95, 95, 'rock'],
      ['l9', 850, 200, 100, 130, 'lava_pillar'],
      ['l10', 850, 870, 100, 130, 'lava_pillar'],
      ['l11', 855, 555, 90, 90, 'lava_pillar'],
    ],
    extras: [
      ['l12', 800, 300, 100, 80, 'rock'],
      ['l13', 1980, 300, 100, 80, 'rock'],
      ['l14', 800, 820, 100, 80, 'rock'],
      ['l15', 1980, 820, 100, 80, 'rock'],
    ],
    redBase: [140, 600, 68],
    blueBase: [1660, 600, 68],
    redSpawns: [
      [135, 280],
      [135, 920],
      [250, 450],
      [250, 750],
    ],
    blueSpawns: [
      [1665, 280],
      [1665, 920],
      [1550, 450],
      [1550, 750],
    ],
    ffaSpawns: [
      [150, 150],
      [1650, 150],
      [150, 1050],
      [1650, 1050],
      [900, 120],
      [900, 1080],
      [460, 600],
      [1340, 600],
    ],
    crateZones: [
      [900, 420],
      [900, 780],
      [520, 600],
      [1280, 600],
      [540, 220],
      [1260, 980],
      [1260, 220],
      [540, 980],
    ],
  },
};

function scaleObs(list, scaleW = true) {
  return list.map(([id, x, y, w, h, kind]) => ({
    id,
    x: sx(x),
    y,
    w: scaleW ? Math.round(w * Math.min(SX, 1.15)) : w,
    h,
    kind,
  }));
}

function scalePts(list) {
  return list.map(([x, y]) => ({ x: sx(x), y }));
}

function scaleBase([x, y, r]) {
  return { x: sx(x), y, radius: r };
}

function fmtPalette(p) {
  return Object.entries(p)
    .map(([k, v]) => `      ${k}: '${v}',`)
    .join('\n');
}
function fmtObs(obs) {
  return obs
    .map(
      (o) =>
        `      { id: '${o.id}', x: ${o.x}, y: ${o.y}, w: ${o.w}, h: ${o.h}, kind: '${o.kind}' },`
    )
    .join('\n');
}
function fmtPts(pts) {
  return pts.map((p) => `      { x: ${p.x}, y: ${p.y} },`).join('\n');
}

let out = `import type { ArenaMap, MapId } from './types.ts';\n\n`;
out += `/** Arena size tuned for wide displays (~21:9) so the map fills common screens. */\n`;
out += `export const ARENA_WIDTH = ${NEW_W};\n`;
out += `export const ARENA_HEIGHT = ${H};\n\n`;
out += `export const ARENA_MAPS: Record<MapId, ArenaMap> = {\n`;

for (const [id, m] of Object.entries(raw)) {
  // Extras are authored in NEW map coordinates already (side lanes).
  const extras = (m.extras || []).map(([eid, x, y, w, h, kind]) => ({
    id: eid,
    x,
    y,
    w,
    h,
    kind,
  }));
  const obstacles = [...scaleObs(m.obstacles), ...extras];
  const redBase = scaleBase(m.redBase);
  const blueBase = scaleBase(m.blueBase);
  const redSpawns = scalePts(m.redSpawns);
  const blueSpawns = scalePts(m.blueSpawns);
  const ffaSpawns = scalePts(m.ffaSpawns);
  const crateZones = scalePts(m.crateZones);

  out += `  ${id}: {\n`;
  out += `    id: '${id}',\n`;
  out += `    name: '${m.name}',\n`;
  out += `    subtitle: '${m.subtitle}',\n`;
  out += `    width: ARENA_WIDTH,\n`;
  out += `    height: ARENA_HEIGHT,\n`;
  out += `    palette: {\n${fmtPalette(m.palette)}\n    },\n`;
  out += `    obstacles: [\n${fmtObs(obstacles)}\n    ],\n`;
  out += `    redBase: { x: ${redBase.x}, y: ${redBase.y}, radius: ${redBase.radius} },\n`;
  out += `    blueBase: { x: ${blueBase.x}, y: ${blueBase.y}, radius: ${blueBase.radius} },\n`;
  out += `    redSpawns: [\n${fmtPts(redSpawns)}\n    ],\n`;
  out += `    blueSpawns: [\n${fmtPts(blueSpawns)}\n    ],\n`;
  out += `    ffaSpawns: [\n${fmtPts(ffaSpawns)}\n    ],\n`;
  out += `    crateZones: [\n${fmtPts(crateZones)}\n    ],\n`;
  out += `  },\n\n`;
}

out += `};\n\n`;
out += `export const MAP_IDS: MapId[] = Object.keys(ARENA_MAPS) as MapId[];\n\n`;
out += `export function getRandomMapId(exclude?: MapId): MapId {\n`;
out += `  const pool = exclude ? MAP_IDS.filter((id) => id !== exclude) : MAP_IDS;\n`;
out += `  return pool[Math.floor(Math.random() * pool.length)];\n`;
out += `}\n`;

fs.writeFileSync('src/shared/maps.ts', out);
console.log(`wrote maps.ts ${NEW_W}x${H}`);
