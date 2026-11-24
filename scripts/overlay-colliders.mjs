// Debug: draw obstacle AABBs over terrain floor using the same uniform-cover mapping as MapRenderer.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { PNG } from 'pngjs';

const id = process.argv[2] ?? 'dunes';
const OUT_W = 2880;
const OUT_H = 1440;
const { BETA_MAPS } = await import(pathToFileURL(path.resolve('src/shared/betaMaps.ts')).href);
const map = BETA_MAPS[id];
const src = PNG.sync.read(fs.readFileSync(`public/maps/${id}.png`));
const cover = Math.max(OUT_W / src.width, OUT_H / src.height);
const sw = OUT_W / cover;
const sh = OUT_H / cover;
const sx0 = (src.width - sw) / 2;
const sy0 = (src.height - sh) / 2;

const W = 1440;
const H = 720;
const out = new PNG({ width: W, height: H });
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const wx = (x / W) * OUT_W;
    const wy = (y / H) * OUT_H;
    const sx = Math.min(src.width - 1, Math.max(0, Math.floor(sx0 + wx / cover)));
    const sy = Math.min(src.height - 1, Math.max(0, Math.floor(sy0 + wy / cover)));
    const si = (sy * src.width + sx) * 4;
    const di = (y * W + x) * 4;
    out.data[di] = src.data[si];
    out.data[di + 1] = src.data[si + 1];
    out.data[di + 2] = src.data[si + 2];
    out.data[di + 3] = 255;
  }
}
const put = (x, y) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  out.data[i] = 255;
  out.data[i + 1] = 0;
  out.data[i + 2] = 0;
};
for (const o of map.obstacles) {
  const x0 = Math.round((o.x / OUT_W) * W);
  const y0 = Math.round((o.y / OUT_H) * H);
  const x1 = Math.round(((o.x + o.w) / OUT_W) * W);
  const y1 = Math.round(((o.y + o.h) / OUT_H) * H);
  for (let x = x0; x <= x1; x++) {
    put(x, y0);
    put(x, y1);
  }
  for (let y = y0; y <= y1; y++) {
    put(x0, y);
    put(x1, y);
  }
}
fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync(`tmp/overlay-${id}.png`, PNG.sync.write(out));
console.log('wrote', `tmp/overlay-${id}.png`, map.obstacles.length, 'cover', cover.toFixed(4));
