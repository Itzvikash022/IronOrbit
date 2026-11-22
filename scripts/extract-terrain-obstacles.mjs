// Color-tuned obstacle extraction for the four terrain PNGs.
import fs from 'node:fs';
import { PNG } from 'pngjs';

const SRC = 'C:/Users/vikas/Downloads/Terrain';
const OUT_W = 2880;
const OUT_H = 1440;

function getPx(data, W, x, y) {
  const i = (y * W + x) * 4;
  return [data[i], data[i + 1], data[i + 2]];
}

function isObstacle(id, r, g, b, x, y, W, H) {
  // Ignore a thin outer frame / star watermark
  if (x < 40 || y < 40 || x > W - 60 || y > H - 60) return false;

  if (id === 'dunes') {
    // Sand floor ~ (239,199,138). Rocks are cooler / greyer / darker brown.
    const sandish = r > 200 && g > 160 && b > 100 && r - b > 60;
    const rock =
      (!sandish && r < 210 && g < 180 && Math.abs(r - g) < 55 && lum(r, g, b) < 175) ||
      (r > 140 && r < 200 && g > 110 && g < 170 && b > 80 && b < 140 && r - b > 20 && lum(r, g, b) < 165);
    // Metal vents: grey
    const vent = Math.abs(r - g) < 18 && Math.abs(g - b) < 18 && r > 90 && r < 170;
    return rock || vent;
  }

  if (id === 'glacier') {
    // Ice floor ~ (150,192,216). Rocks are darker grey-blue chunks.
    const L = lum(r, g, b);
    return L < 145 && b > r - 10 && g > 80;
  }

  if (id === 'magma') {
    // Floor dark brown ~ (49,31,29). Blocks are also dark but flatter / slightly different;
    // prefer slightly brighter rock faces and greyish bricks.
    const L = lum(r, g, b);
    const warmCrack = r > 90 && r > g + 25 && r > b + 25; // lava veins — ignore
    if (warmCrack) return false;
    // Mid-tone rock faces (lighter tops of blocks)
    if (L > 55 && L < 120 && Math.abs(r - g) < 35 && r < 140) return true;
    // Very dark block bodies still denser than cracked floor speckles: require neighborhood later
    return L < 40 && Math.abs(r - g) < 25;
  }

  if (id === 'storm') {
    // Floor olive ~ (112,123,93). Rocks are cooler grey.
    const L = lum(r, g, b);
    const grey = Math.abs(r - g) < 20 && Math.abs(g - b) < 25;
    return grey && L < 105 && L > 35 && b >= g - 15;
  }
  return false;
}

function lum(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function extract(id, file, minPixels, minSide, erodeR = 2) {
  const png = PNG.sync.read(fs.readFileSync(`${SRC}/${file}`));
  const { width: W, height: H, data } = png;
  const sx = OUT_W / W;
  const sy = OUT_H / H;
  const mask = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const [r, g, b] = getPx(data, W, x, y);
      if (isObstacle(id, r, g, b, x, y, W, H)) mask[y * W + x] = 1;
    }
  }
  const solid = new Uint8Array(W * H);
  for (let y = erodeR; y < H - erodeR; y++) {
    for (let x = erodeR; x < W - erodeR; x++) {
      let ok = 1;
      for (let dy = -erodeR; dy <= erodeR && ok; dy++) {
        for (let dx = -erodeR; dx <= erodeR; dx++) {
          if (!mask[(y + dy) * W + (x + dx)]) {
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
        minX = Math.min(minX, px);
        maxX = Math.max(maxX, px);
        minY = Math.min(minY, py);
        maxY = Math.max(maxY, py);
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
      if (count < minPixels) continue;
      if (Math.max(bw, bh) < minSide) continue;
      if (bw > W * 0.65 && bh > H * 0.65) continue;
      boxes.push({
        x: Math.round(minX * sx),
        y: Math.round(minY * sy),
        w: Math.round(bw * sx),
        h: Math.round(bh * sy),
        pixels: count,
      });
    }
  }
  boxes.sort((a, b) => b.pixels - a.pixels);

  // Split very large elongated clusters into grid cells when sparse fill
  const refined = [];
  for (const b of boxes) {
    if (b.w * b.h > 220 * 220 && b.pixels / ((b.w / sx) * (b.h / sy)) < 0.35 && (b.w > 350 || b.h > 350)) {
      // keep as-is but clamp max size by taking dense core already represented; skip mega blobs
      if (b.w > 700 || b.h > 700) continue;
    }
    refined.push(b);
  }

  // Clamp inside arena and shrink slightly so collision sits inside painted rock
  return refined.map((b) => {
    const pad = 6;
    let x = b.x + pad;
    let y = b.y + pad;
    let w = b.w - pad * 2;
    let h = b.h - pad * 2;
    x = Math.max(40, Math.min(x, OUT_W - 40));
    y = Math.max(40, Math.min(y, OUT_H - 40));
    w = Math.max(36, Math.min(w, OUT_W - x - 40));
    h = Math.max(36, Math.min(h, OUT_H - y - 40));
    return { x, y, w, h };
  });
}

const FILES = {
  dunes: ['sand.png', 700, 28, 2],
  glacier: ['glacier.png', 900, 32, 2],
  magma: ['magma.png', 450, 26, 1],
  storm: ['stormy.png', 500, 28, 2],
};

const out = {};
for (const [id, [file, minPix, minSide, erode]] of Object.entries(FILES)) {
  const boxes = extract(id, file, minPix, minSide, erode);
  out[id] = boxes;
  console.log(id, boxes.length, boxes.map((b) => `${b.x},${b.y} ${b.w}x${b.h}`).join(' | '));
}
fs.writeFileSync('scripts/terrain-extracted.json', JSON.stringify(out, null, 2));
