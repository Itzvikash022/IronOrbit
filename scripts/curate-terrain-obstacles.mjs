// Curate extracted AABBs against spawn/crate/base clearances and write obstacle lists.
import fs from 'node:fs';

const W = 2880;
const H = 1440;
const TANK_R = 20;
const CRATE_R = 18;
const raw = JSON.parse(fs.readFileSync('scripts/terrain-extracted.json', 'utf8'));

const STD = {
  redBase: { x: 224, y: 720, radius: 68 },
  blueBase: { x: W - 224, y: 720, radius: 68 },
  redSpawns: [
    { x: 192, y: 432 },
    { x: 192, y: 1008 },
    { x: 368, y: 216 },
    { x: 368, y: 1224 },
  ],
  blueSpawns: [
    { x: W - 192, y: 432 },
    { x: W - 192, y: 1008 },
    { x: W - 368, y: 216 },
    { x: W - 368, y: 1224 },
  ],
  ffaSpawns: [
    { x: 240, y: 180 },
    { x: W - 240, y: 180 },
    { x: 240, y: 1260 },
    { x: W - 240, y: 1260 },
    { x: 1440, y: 168 },
    { x: 1440, y: 1272 },
    { x: 768, y: 720 },
    { x: W - 768, y: 720 },
  ],
  crateZones: [
    { x: 1440, y: 384 },
    { x: 1440, y: 1056 },
    { x: 832, y: 720 },
    { x: W - 832, y: 720 },
    { x: 832, y: 216 },
    { x: W - 832, y: 1224 },
    { x: W - 832, y: 216 },
    { x: 832, y: 1224 },
  ],
};

function circleRectDist(cx, cy, r) {
  const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
  return Math.hypot(cx - nx, cy - ny);
}

function okAgainstAnchors(box) {
  for (const p of [...STD.ffaSpawns, ...STD.redSpawns, ...STD.blueSpawns]) {
    if (circleRectDist(p.x, p.y, box) < TANK_R + 4) return false;
  }
  for (const p of STD.crateZones) {
    if (circleRectDist(p.x, p.y, box) < CRATE_R + 10) return false;
  }
  for (const b of [STD.redBase, STD.blueBase]) {
    if (circleRectDist(b.x, b.y, box) < b.radius + TANK_R + 10) return false;
  }
  return true;
}

function gap(a, b) {
  const dx = Math.max(a.x - (b.x + b.w), b.x - (a.x + a.w), 0);
  const dy = Math.max(a.y - (b.y + b.h), b.y - (a.y + a.h), 0);
  return Math.hypot(dx, dy);
}

function curate(id, boxes, { max, minArea, maxW, maxH, kind }) {
  const filtered = boxes
    .map((b) => ({ ...b }))
    .filter((b) => b.w * b.h >= minArea)
    .filter((b) => b.w <= maxW && b.h <= maxH)
    .filter((b) => b.x > 30 && b.y > 30 && b.x + b.w < W - 30 && b.y + b.h < H - 30)
    .filter(okAgainstAnchors)
    .sort((a, b) => b.w * b.h - a.w * a.h);

  const picked = [];
  for (const b of filtered) {
    if (picked.length >= max) break;
    if (picked.some((p) => gap(p, b) < 40 && overlapRatio(p, b) > 0.15)) continue;
    // soft reject near-duplicates
    if (picked.some((p) => overlapRatio(p, b) > 0.45)) continue;
    picked.push(b);
  }

  return picked.map((b, i) => ({
    id: `${id.slice(0, 2)}${i + 1}`,
    x: b.x,
    y: b.y,
    w: b.w,
    h: b.h,
    kind,
  }));
}

function overlapRatio(a, b) {
  const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const o = ox * oy;
  if (o <= 0) return 0;
  return o / Math.min(a.w * a.h, b.w * b.h);
}

const KIND = {
  dunes: 'ruin',
  glacier: 'ice_wall',
  magma: 'rock',
  storm: 'rock',
};

const out = {};
for (const id of ['dunes', 'glacier', 'magma', 'storm']) {
  // Pre-shrink giant clusters so they survive maxW/H filters but stay inside painted rock
  const pre = raw[id].map((b) => {
    const o = { ...b };
    if (o.w > 380) {
      const cut = o.w - 380;
      o.x += Math.floor(cut / 2);
      o.w = 380;
    }
    if (o.h > 300) {
      const cut = o.h - 300;
      o.y += Math.floor(cut / 2);
      o.h = 300;
    }
    return o;
  });
  const obstacles = curate(id, pre, {
    max: id === 'storm' ? 10 : id === 'glacier' ? 16 : 14,
    minArea: id === 'magma' ? 2500 : 3200,
    maxW: 400,
    maxH: 320,
    kind: KIND[id],
  }).filter((o) => !(o.x < 80 && o.y < 80) && !(o.x + o.w > W - 80 && o.y + o.h > H - 80));
  out[id] = obstacles.filter(okAgainstAnchors);
  console.log(id, out[id].length, out[id].map((o) => `${o.id}:${o.x},${o.y} ${o.w}x${o.h}`).join(' | '));
}

fs.writeFileSync('scripts/terrain-obstacles-curated.json', JSON.stringify(out, null, 2));
