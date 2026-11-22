/**
 * Rebuild collision AABBs for baked terrain floors so they sit on painted solid objects.
 * Also scrubs the Gemini sparkle watermark from the bottom-right corner of each floor PNG.
 */
import fs from 'node:fs';
import { PNG } from 'pngjs';

const OUT_W = 2880;
const OUT_H = 1440;
const TANK_R = 20;
const CRATE_R = 18;

const FILES = {
  dunes: 'public/maps/dunes.png',
  glacier: 'public/maps/glacier.png',
  magma: 'public/maps/magma.png',
  storm: 'public/maps/storm.png',
};

const KIND = {
  dunes: 'ruin',
  glacier: 'ice_wall',
  magma: 'rock',
  storm: 'rock',
};

const ANCHORS = {
  redBase: { x: 224, y: 720, radius: 68 },
  blueBase: { x: OUT_W - 224, y: 720, radius: 68 },
  spawns: [
    { x: 192, y: 432 },
    { x: 192, y: 1008 },
    { x: 368, y: 216 },
    { x: 400, y: 1180 },
    { x: OUT_W - 192, y: 432 },
    { x: OUT_W - 192, y: 1008 },
    { x: OUT_W - 368, y: 216 },
    { x: OUT_W - 400, y: 1180 },
    { x: 240, y: 180 },
    { x: OUT_W - 240, y: 180 },
    { x: 240, y: 1260 },
    { x: OUT_W - 240, y: 1260 },
    { x: 1440, y: 150 },
    { x: 1440, y: 1320 },
    { x: 700, y: 700 },
    { x: OUT_W - 700, y: 700 },
  ],
  crates: [
    { x: 1440, y: 360 },
    { x: 1440, y: 1080 },
    { x: 900, y: 720 },
    { x: OUT_W - 900, y: 720 },
    { x: 900, y: 240 },
    { x: OUT_W - 900, y: 1200 },
    { x: OUT_W - 900, y: 240 },
    { x: 900, y: 1200 },
  ],
};

function lum(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isSolid(id, r, g, b, x, y, W, H) {
  // Ignore outer frame + watermark corner
  if (x < 36 || y < 36 || x > W - 40 || y > H - 40) return false;
  if (x > W - 140 && y > H - 140) return false;

  if (id === 'dunes') {
    // Floor is warm sand (~239,199,138). Solids are cooler stone / grey vents.
    const sand =
      r > 205 && g > 165 && b > 95 && r - b > 55 && Math.abs(r - g) < 55;
    if (sand) return false;
    const vent = Math.abs(r - g) < 16 && Math.abs(g - b) < 18 && r >= 95 && r <= 175;
    const stone =
      r >= 120 &&
      r <= 205 &&
      g >= 95 &&
      g <= 175 &&
      b >= 70 &&
      b <= 145 &&
      r - b > 15 &&
      lum(r, g, b) < 175;
    return vent || stone;
  }

  if (id === 'glacier') {
    const L = lum(r, g, b);
    // Floor pale blue; rocks darker grey-blue
    return L < 150 && b >= r - 5 && g > 70 && !(r > 200 && g > 210 && b > 220);
  }

  if (id === 'magma') {
    if (r > 90 && r > g + 20 && r > b + 20) return false; // lava veins
    const L = lum(r, g, b);
    return (L > 48 && L < 115 && Math.abs(r - g) < 40) || (L < 42 && Math.abs(r - g) < 28);
  }

  if (id === 'storm') {
    const L = lum(r, g, b);
    const grey = Math.abs(r - g) < 22 && Math.abs(g - b) < 28;
    return grey && L > 30 && L < 110;
  }
  return false;
}

function extract(id, file) {
  const png = PNG.sync.read(fs.readFileSync(file));
  const { width: W, height: H, data } = png;
  const sx = OUT_W / W;
  const sy = OUT_H / H;
  const mask = new Uint8Array(W * H);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (isSolid(id, data[i], data[i + 1], data[i + 2], x, y, W, H)) mask[y * W + x] = 1;
    }
  }

  // Close small gaps inside rocks, then erode speckles
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
      const minPixels = id === 'dunes' ? 450 : id === 'magma' ? 350 : 500;
      const minSide = id === 'dunes' ? 22 : 24;
      if (count < minPixels) continue;
      if (Math.max(bw, bh) < minSide) continue;
      if (bw > W * 0.55 && bh > H * 0.55) continue;

      // Shrink slightly so AABB sits inside painted rock (avoids "ghost walls" on sand)
      const padX = Math.max(2, Math.round(bw * 0.06));
      const padY = Math.max(2, Math.round(bh * 0.06));
      let x0 = Math.round((minX + padX) * sx);
      let y0 = Math.round((minY + padY) * sy);
      let w0 = Math.round((bw - padX * 2) * sx);
      let h0 = Math.round((bh - padY * 2) * sy);
      w0 = Math.max(32, w0);
      h0 = Math.max(32, h0);
      x0 = Math.max(40, Math.min(x0, OUT_W - 40 - w0));
      y0 = Math.max(40, Math.min(y0, OUT_H - 40 - h0));
      boxes.push({ x: x0, y: y0, w: w0, h: h0, pixels: count });
    }
  }

  boxes.sort((a, b) => b.pixels - a.pixels);
  return boxes;
}

function circleRectDist(cx, cy, r) {
  const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
  return Math.hypot(cx - nx, cy - ny);
}

function ok(box) {
  for (const p of ANCHORS.spawns) {
    if (circleRectDist(p.x, p.y, box) < TANK_R + 4) return false;
  }
  for (const p of ANCHORS.crates) {
    if (circleRectDist(p.x, p.y, box) < CRATE_R + 10) return false;
  }
  for (const b of [ANCHORS.redBase, ANCHORS.blueBase]) {
    if (circleRectDist(b.x, b.y, box) < b.radius + TANK_R + 10) return false;
  }
  return true;
}

function overlapRatio(a, b) {
  const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const o = ox * oy;
  if (o <= 0) return 0;
  return o / Math.min(a.w * a.h, b.w * b.h);
}

function curate(id, boxes) {
  const max = id === 'dunes' ? 22 : id === 'glacier' ? 18 : 16;
  const picked = [];
  for (const b of boxes) {
    if (picked.length >= max) break;
    if (b.w > 420 || b.h > 340) continue;
    if (!ok(b)) continue;
    if (picked.some((p) => overlapRatio(p, b) > 0.4)) continue;
    picked.push(b);
  }
  return picked.map((b, i) => ({
    id: `${id.slice(0, 2)}${i + 1}`,
    x: b.x,
    y: b.y,
    w: b.w,
    h: b.h,
    kind: KIND[id],
  }));
}

function scrubWatermark(file) {
  const png = PNG.sync.read(fs.readFileSync(file));
  const { width: W, height: H, data } = png;
  // Sample floor color just outside the watermark zone
  const samples = [];
  for (let y = H - 200; y < H - 150; y += 4) {
    for (let x = W - 220; x < W - 160; x += 4) {
      const i = (y * W + x) * 4;
      samples.push([data[i], data[i + 1], data[i + 2]]);
    }
  }
  samples.sort((a, b) => lum(...a) - lum(...b));
  const bg = samples[Math.floor(samples.length / 2)];
  const zone = 130;
  for (let y = H - zone; y < H; y++) {
    for (let x = W - zone; x < W; x++) {
      const i = (y * W + x) * 4;
      const L = lum(data[i], data[i + 1], data[i + 2]);
      // Bright sparkle / white mark
      if (L > lum(...bg) + 25 || (data[i] > 220 && data[i + 1] > 220 && data[i + 2] > 220)) {
        data[i] = bg[0];
        data[i + 1] = bg[1];
        data[i + 2] = bg[2];
      }
    }
  }
  // Soft fill entire corner with slight noise from bg to erase residual glyph
  for (let y = H - 90; y < H; y++) {
    for (let x = W - 90; x < W; x++) {
      const i = (y * W + x) * 4;
      const j = ((Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1 + 1) % 1;
      data[i] = Math.max(0, Math.min(255, bg[0] + Math.floor((j - 0.5) * 8)));
      data[i + 1] = Math.max(0, Math.min(255, bg[1] + Math.floor((j - 0.5) * 8)));
      data[i + 2] = Math.max(0, Math.min(255, bg[2] + Math.floor((j - 0.5) * 8)));
    }
  }
  fs.writeFileSync(file, PNG.sync.write(png));
}

const result = {};
for (const [id, file] of Object.entries(FILES)) {
  scrubWatermark(file);
  const boxes = extract(id, file);
  result[id] = curate(id, boxes);
  console.log(
    id,
    'raw',
    boxes.length,
    'kept',
    result[id].length,
    result[id].map((o) => `${o.x},${o.y} ${o.w}x${o.h}`).join(' | ')
  );
}

fs.writeFileSync('scripts/terrain-obstacles-curated.json', JSON.stringify(result, null, 2));
console.log('scrubbed watermarks + wrote curated obstacles');
