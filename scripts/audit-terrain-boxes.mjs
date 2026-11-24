import fs from 'node:fs';
import { PNG } from 'pngjs';

const OUT_W = 2880;
const OUT_H = 1440;

function lum(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isSolid(id, r, g, b, x, y, W, H) {
  if (x < 36 || y < 36 || x > W - 40 || y > H - 40) return false;
  if (x > W - 140 && y > H - 140) return false;
  if (id === 'dunes') {
    const sand = r > 205 && g > 165 && b > 95 && r - b > 55 && Math.abs(r - g) < 55;
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
  return false;
}

const id = process.argv[2] || 'dunes';
const png = PNG.sync.read(fs.readFileSync(`public/maps/${id}.png`));
const { width: W, height: H, data } = png;
const sx = OUT_W / W;
const sy = OUT_H / H;
const curated = JSON.parse(fs.readFileSync('scripts/terrain-obstacles-curated.json', 'utf8'))[id];

for (const o of curated) {
  const x0 = Math.floor(o.x / sx);
  const y0 = Math.floor(o.y / sy);
  const x1 = Math.min(W - 1, Math.ceil((o.x + o.w) / sx));
  const y1 = Math.min(H - 1, Math.ceil((o.y + o.h) / sy));
  let solid = 0;
  let total = 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      total++;
      const i = (y * W + x) * 4;
      if (isSolid(id, data[i], data[i + 1], data[i + 2], x, y, W, H)) solid++;
    }
  }
  const fill = solid / total;
  const flag = fill < 0.28 ? '<< GHOST/LOOSE' : fill < 0.4 ? '~ weak' : 'ok';
  console.log(
    `${o.id.padEnd(6)} fill=${fill.toFixed(3)} ${String(solid).padStart(5)}/${String(total).padStart(5)}  ${o.x},${o.y} ${o.w}x${o.h}  ${flag}`
  );
}
