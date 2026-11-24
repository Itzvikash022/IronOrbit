// Extract AABBs from normalized 2880x1440 terrain PNGs (no watermark scrub).
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

// Reuse extract/curate by importing logic — inline a thin runner calling the same file's functions via spawn
import { PNG } from 'pngjs';

const OUT_W = 2880;
const OUT_H = 1440;
const TANK_R = 20;
const CRATE_R = 18;
const KIND = { dunes: 'ruin', glacier: 'ice_wall', magma: 'rock', storm: 'rock' };
const FILES = {
  dunes: 'public/maps/dunes.png',
  glacier: 'public/maps/glacier.png',
  magma: 'public/maps/magma.png',
  storm: 'public/maps/storm.png',
};

function lum(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isSolid(id, r, g, b, x, y, W, H) {
  if (x < 40 || y < 40 || x > W - 44 || y > H - 44) return false;
  if (id === 'dunes') {
    const sand = r > 205 && g > 165 && b > 95 && r - b > 55 && Math.abs(r - g) < 55;
    if (sand) return false;
    const vent = Math.abs(r - g) < 16 && Math.abs(g - b) < 18 && r >= 95 && r <= 175;
    const stone =
      r >= 120 && r <= 205 && g >= 95 && g <= 175 && b >= 70 && b <= 145 && r - b > 15 && lum(r, g, b) < 175;
    return vent || stone;
  }
  if (id === 'glacier') {
    const L = lum(r, g, b);
    return L < 145 && b >= r - 8 && g > 65 && !(r > 200 && g > 210 && b > 220);
  }
  if (id === 'magma') {
    if (r > 90 && r > g + 20 && r > b + 20) return false;
    const L = lum(r, g, b);
    return (L > 55 && L < 130 && Math.abs(r - g) < 35) || (L < 50 && Math.abs(r - g) < 25 && L > 25);
  }
  if (id === 'storm') {
    const L = lum(r, g, b);
    const grey = Math.abs(r - g) < 22 && Math.abs(g - b) < 28;
    return grey && L > 35 && L < 115;
  }
  return false;
}

function extract(id, file) {
  const png = PNG.sync.read(fs.readFileSync(file));
  const { width: W, height: H, data } = png;
  const mask = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (isSolid(id, data[i], data[i + 1], data[i + 2], x, y, W, H)) mask[y * W + x] = 1;
    }
  }
  const closed = new Uint8Array(W * H);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) n += mask[(y + dy) * W + (x + dx)];
      closed[y * W + x] = n >= 3 ? 1 : 0;
    }
  }
  const erodeR = id === 'magma' ? 1 : 2;
  const solid = new Uint8Array(W * H);
  for (let y = erodeR; y < H - erodeR; y++) {
    for (let x = erodeR; x < W - erodeR; x++) {
      let ok = 1;
      for (let dy = -erodeR; dy <= erodeR && ok; dy++) {
        for (let dx = -erodeR; dx <= erodeR; dx++) {
          if (!closed[(y + dy) * W + (x + dx)]) {
            ok = 0;
            break;
          }
        }
      }
      solid[y * W + x] = ok;
    }
  }
  const seen = new Uint8Array(W * H);
  const boxes = [];
  const stack = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const start = y * W + x;
      if (!solid[start] || seen[start]) continue;
      let minX = x,
        maxX = x,
        minY = y,
        maxY = y,
        count = 0;
      stack.length = 0;
      stack.push(start);
      seen[start] = 1;
      while (stack.length) {
        const p = stack.pop();
        const px = p % W;
        const py = (p / W) | 0;
        count++;
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
        for (const [nx, ny] of [
          [px - 1, py],
          [px + 1, py],
          [px, py - 1],
          [px, py + 1],
        ]) {
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const ni = ny * W + nx;
          if (!solid[ni] || seen[ni]) continue;
          seen[ni] = 1;
          stack.push(ni);
        }
      }
      const bw = maxX - minX + 1;
      const bh = maxY - minY + 1;
      const minPixels = id === 'dunes' ? 400 : id === 'magma' ? 280 : 450;
      if (count < minPixels) continue;
      if (Math.max(bw, bh) < 20) continue;
      if (bw > W * 0.5 && bh > H * 0.5) continue;
      // Tight inset — prefer slightly inside rock over ghost sand walls
      const padX = Math.max(1, Math.round(bw * 0.03));
      const padY = Math.max(1, Math.round(bh * 0.03));
      let x0 = minX + padX;
      let y0 = minY + padY;
      let w0 = Math.max(24, bw - padX * 2);
      let h0 = Math.max(24, bh - padY * 2);
      x0 = Math.max(32, Math.min(x0, OUT_W - 32 - w0));
      y0 = Math.max(32, Math.min(y0, OUT_H - 32 - h0));
      boxes.push({ x: x0, y: y0, w: w0, h: h0, pixels: count });
    }
  }
  boxes.sort((a, b) => b.pixels - a.pixels);
  return boxes;
}

function overlapRatio(a, b) {
  const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const o = ox * oy;
  if (o <= 0) return 0;
  return o / Math.min(a.w * a.h, b.w * b.h);
}

const MAX = { dunes: 24, glacier: 22, magma: 40, storm: 20 };
const result = {};
for (const [id, file] of Object.entries(FILES)) {
  const boxes = extract(id, file);
  const picked = [];
  for (const b of boxes) {
    if (picked.length >= MAX[id]) break;
    if (b.w > 520 || b.h > 420) continue;
    if (picked.some((p) => overlapRatio(p, b) > 0.45)) continue;
    picked.push(b);
  }
  result[id] = picked.map((b, i) => ({
    id: `${id.slice(0, 2)}${i + 1}`,
    x: b.x,
    y: b.y,
    w: b.w,
    h: b.h,
    kind: KIND[id],
  }));
  console.log(id, 'raw', boxes.length, 'kept', result[id].length);
}

fs.writeFileSync('scripts/terrain-obstacles-curated.json', JSON.stringify(result, null, 2) + '\n');
console.log('wrote curated');
