// Uniform cover-crop each public/maps/*.png into exact 2880x1440 (no anisotropic stretch).
import fs from 'node:fs';
import { PNG } from 'pngjs';

const OUT_W = 2880;
const OUT_H = 1440;
const IDS = ['dunes', 'glacier', 'magma', 'storm'];

function sample(src, x, y) {
  const sx = Math.max(0, Math.min(src.width - 1, Math.floor(x)));
  const sy = Math.max(0, Math.min(src.height - 1, Math.floor(y)));
  const i = (sy * src.width + sx) * 4;
  return [src.data[i], src.data[i + 1], src.data[i + 2], src.data[i + 3]];
}

for (const id of IDS) {
  const file = `public/maps/${id}.png`;
  const src = PNG.sync.read(fs.readFileSync(file));
  if (src.width === OUT_W && src.height === OUT_H) {
    console.log(id, 'already', OUT_W, OUT_H);
    continue;
  }
  // Cover: fill OUT, crop excess on the long axis
  const scale = Math.max(OUT_W / src.width, OUT_H / src.height);
  const sw = OUT_W / scale;
  const sh = OUT_H / scale;
  const sx0 = (src.width - sw) / 2;
  const sy0 = (src.height - sh) / 2;

  const out = new PNG({ width: OUT_W, height: OUT_H });
  for (let y = 0; y < OUT_H; y++) {
    for (let x = 0; x < OUT_W; x++) {
      const i = (y * OUT_W + x) * 4;
      const [r, g, b, a] = sample(src, sx0 + x / scale, sy0 + y / scale);
      out.data[i] = r;
      out.data[i + 1] = g;
      out.data[i + 2] = b;
      out.data[i + 3] = a;
    }
  }
  fs.writeFileSync(file, PNG.sync.write(out));
  console.log(id, `${src.width}x${src.height}`, '->', `${OUT_W}x${OUT_H}`, `scale ${scale.toFixed(4)}`);
}
