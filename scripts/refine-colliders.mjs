// Refine hand-picked rough boxes (in 1024x512 preview coords of public/maps/<id>.png) into tight
// collision AABBs by segmenting "non-ground" pixels inside each rough box.
// Usage: node scripts/refine-colliders.mjs dunes   (writes scripts/terrain-obstacles-curated.json[id])
import fs from 'node:fs';
import { PNG } from 'pngjs';

const id = process.argv[2];
const WORLD_W = 2880;
const WORLD_H = 1440;
const PREV_W = 1024;
const K = WORLD_W / PREV_W; // preview -> world

const ROUGH = JSON.parse(fs.readFileSync(`scripts/rough-${id}.json`, 'utf8'));
const THRESH = Number(process.argv[3] ?? 55);
const INSET = Number(process.argv[4] ?? 4);
const KIND = { dunes: 'ruin', glacier: 'ice_wall', magma: 'rock', storm: 'rock' }[id];

const src = PNG.sync.read(fs.readFileSync(`public/maps/${id}.png`));
const sx = src.width / WORLD_W;
const sy = src.height / WORLD_H;
const px = (wx, wy) => {
  const x = Math.min(src.width - 1, Math.max(0, Math.floor(wx * sx)));
  const y = Math.min(src.height - 1, Math.max(0, Math.floor(wy * sy)));
  const i = (y * src.width + x) * 4;
  return [src.data[i], src.data[i + 1], src.data[i + 2]];
};

const STEP = 3; // world px per grid cell

const RAW = process.argv[5] === 'raw';

function refine(r) {
  if (RAW) {
    return {
      x: (r[0] + 1) * K,
      y: (r[1] + 1) * K,
      w: (r[2] - r[0] - 2) * K,
      h: (r[3] - r[1] - 2) * K,
    };
  }
  const x0 = Math.max(0, Math.floor(r[0] * K) - 20);
  const y0 = Math.max(0, Math.floor(r[1] * K) - 20);
  const x1 = Math.min(WORLD_W, Math.ceil(r[2] * K) + 20);
  const y1 = Math.min(WORLD_H, Math.ceil(r[3] * K) + 20);
  const gw = Math.ceil((x1 - x0) / STEP);
  const gh = Math.ceil((y1 - y0) / STEP);
  // ground colour = median of a ring just outside the padded box
  const ring = [];
  for (let x = x0; x < x1; x += 6) {
    ring.push(px(x, Math.max(0, y0 - 6)));
    ring.push(px(x, Math.min(WORLD_H - 1, y1 + 6)));
  }
  for (let y = y0; y < y1; y += 6) {
    ring.push(px(Math.max(0, x0 - 6), y));
    ring.push(px(Math.min(WORLD_W - 1, x1 + 6), y));
  }
  const med = [0, 1, 2].map((c) => {
    const v = ring.map((p) => p[c]).sort((a, b) => a - b);
    return v[Math.floor(v.length / 2)];
  });
  const mask = new Uint8Array(gw * gh);
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      const p = px(x0 + gx * STEP, y0 + gy * STEP);
      const d = Math.hypot(p[0] - med[0], p[1] - med[1], p[2] - med[2]);
      mask[gy * gw + gx] = d > THRESH ? 1 : 0;
    }
  }
  // largest connected component that overlaps the rough (unpadded) centre area
  const seen = new Uint8Array(gw * gh);
  let best = null;
  for (let s = 0; s < mask.length; s++) {
    if (!mask[s] || seen[s]) continue;
    const q = [s];
    seen[s] = 1;
    let minx = gw, miny = gh, maxx = 0, maxy = 0, n = 0;
    while (q.length) {
      const c = q.pop();
      const cx = c % gw;
      const cy = (c / gw) | 0;
      n++;
      if (cx < minx) minx = cx;
      if (cx > maxx) maxx = cx;
      if (cy < miny) miny = cy;
      if (cy > maxy) maxy = cy;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
        const ni = ny * gw + nx;
        if (mask[ni] && !seen[ni]) {
          seen[ni] = 1;
          q.push(ni);
        }
      }
    }
    if (!best || n > best.n) best = { n, minx, miny, maxx, maxy };
  }
  if (!best) return null;
  return {
    x: x0 + best.minx * STEP + INSET,
    y: y0 + best.miny * STEP + INSET,
    w: (best.maxx - best.minx + 1) * STEP - INSET * 2,
    h: (best.maxy - best.miny + 1) * STEP - INSET * 2,
  };
}

const out = [];
ROUGH.forEach((r, i) => {
  const b = refine(r);
  if (!b) {
    console.warn('no component for', i, r);
    return;
  }
  const o = { id: `${id.slice(0, 2)}${i + 1}`, x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.w), h: Math.round(b.h), kind: KIND };
  console.log(o.id, JSON.stringify(r), '->', o.x, o.y, o.w, o.h);
  out.push(o);
});

const curatedPath = 'scripts/terrain-obstacles-curated.json';
const cur = JSON.parse(fs.readFileSync(curatedPath, 'utf8'));
cur[id] = out;
fs.writeFileSync(curatedPath, JSON.stringify(cur, null, 2) + '\n');
console.log('wrote', out.length, 'obstacles for', id);
