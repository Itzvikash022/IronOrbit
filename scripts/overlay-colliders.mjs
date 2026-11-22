// Debug: draw obstacle AABBs over a terrain map PNG -> tmp/overlay-<id>.png (half scale)
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { PNG } from 'pngjs';

const id = process.argv[2] ?? 'dunes';
const { BETA_MAPS } = await import(pathToFileURL(path.resolve('src/shared/betaMaps.ts')).href);
const map = BETA_MAPS[id];
const src = PNG.sync.read(fs.readFileSync(`public/maps/${id}.png`));
const W = 1440;
const H = 720;
const out = new PNG({ width: W, height: H });
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const sx = Math.min(src.width - 1, Math.floor((x / W) * src.width));
    const sy = Math.min(src.height - 1, Math.floor((y / H) * src.height));
    const si = (sy * src.width + sx) * 4;
    const di = (y * W + x) * 4;
    out.data[di] = src.data[si];
    out.data[di + 1] = src.data[si + 1];
    out.data[di + 2] = src.data[si + 2];
    out.data[di + 3] = 255;
  }
}
const put = (x, y, r, g, b) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  out.data[i] = r; out.data[i + 1] = g; out.data[i + 2] = b;
};
for (const o of map.obstacles) {
  const x0 = Math.round(o.x / 2), y0 = Math.round(o.y / 2);
  const x1 = Math.round((o.x + o.w) / 2), y1 = Math.round((o.y + o.h) / 2);
  for (let x = x0; x <= x1; x++) for (const t of [0, 1]) { put(x, y0 + t, 255, 0, 0); put(x, y1 + t, 255, 0, 0); }
  for (let y = y0; y <= y1; y++) for (const t of [0, 1]) { put(x0 + t, y, 255, 0, 0); put(x1 + t, y, 255, 0, 0); }
}
fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync(`tmp/overlay-${id}.png`, PNG.sync.write(out));
console.log('wrote', `tmp/overlay-${id}.png`, map.obstacles.length);
