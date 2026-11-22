// Remove the Gemini sparkle (and glacier footer text) from terrain floor PNGs via diffusion inpainting:
// pixels inside each box are replaced by a smooth blend of the surrounding floor colours + light noise.
// Run on pristine art (git: 8e32bf2). Usage: node scripts/scrub-watermark.mjs [--crop]
import fs from 'node:fs';
import { PNG } from 'pngjs';

const IDS = ['dunes', 'glacier', 'magma', 'storm'];
const CROP = process.argv.includes('--crop');

// boxes expressed as offsets from the right/bottom edges: [fromRightFar, fromRightNear, fromBottomFar, fromBottomNear]
const BOXES = {
  dunes: [[175, 52, 175, 52]],
  glacier: [
    [175, 52, 175, 52],
    [315, 28, 30, 0], // footer text
  ],
  magma: [[175, 52, 175, 52]],
  storm: [[175, 52, 175, 52]],
};

function inpaint(png, x0, y0, x1, y1) {
  const { width: W, height: H, data } = png;
  x0 = Math.max(0, x0);
  y0 = Math.max(0, y0);
  x1 = Math.min(W, x1);
  y1 = Math.min(H, y1);
  const bw = x1 - x0;
  const bh = y1 - y0;
  const buf = [new Float32Array(bw * bh * 3), new Float32Array(bw * bh * 3)];
  // initial guess: mean of ring just outside
  const ring = [];
  const grab = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4;
    ring.push([data[i], data[i + 1], data[i + 2]]);
  };
  for (let x = x0; x < x1; x++) { grab(x, y0 - 2); grab(x, y1 + 1); }
  for (let y = y0; y < y1; y++) { grab(x0 - 2, y); grab(x1 + 1, y); }
  const mean = [0, 1, 2].map((c) => ring.reduce((s, p) => s + p[c], 0) / ring.length);
  for (let k = 0; k < bw * bh; k++) for (let c = 0; c < 3; c++) buf[0][k * 3 + c] = mean[c];
  const px = (x, y, c) => data[(y * W + x) * 4 + c];
  let cur = 0;
  for (let it = 0; it < 900; it++) {
    const src = buf[cur];
    const dst = buf[1 - cur];
    for (let y = 0; y < bh; y++) {
      for (let x = 0; x < bw; x++) {
        for (let c = 0; c < 3; c++) {
          let s = 0;
          let n = 0;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx;
            const ny = y + dy;
            const gx = x0 + nx;
            const gy = y0 + ny;
            if (gx < 0 || gy < 0 || gx >= W || gy >= H) continue;
            if (nx < 0 || ny < 0 || nx >= bw || ny >= bh) s += px(gx, gy, c);
            else s += src[(ny * bw + nx) * 3 + c];
            n++;
          }
          dst[(y * bw + x) * 3 + c] = s / n;
        }
      }
    }
    cur = 1 - cur;
  }
  const res = buf[cur];
  let seed = 1234567;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) - 0.5;
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const di = ((y0 + y) * W + (x0 + x)) * 4;
      const n = rnd() * 5;
      for (let c = 0; c < 3; c++) data[di + c] = Math.max(0, Math.min(255, Math.round(res[(y * bw + x) * 3 + c] + n)));
    }
  }
}

for (const id of IDS) {
  const file = `public/maps/${id}.png`;
  const png = PNG.sync.read(fs.readFileSync(file));
  const { width: W, height: H } = png;
  for (const [rf, rn, bf, bn] of BOXES[id]) inpaint(png, W - rf, H - bf, W - rn, H - bn);
  fs.writeFileSync(file, PNG.sync.write(png));
  if (CROP) {
    const w = 420;
    const h = 300;
    const out = new PNG({ width: w, height: h });
    PNG.bitblt(png, out, W - w, H - h, w, h, 0, 0);
    fs.writeFileSync(`tmp/crop-${id}.png`, PNG.sync.write(out));
  }
  console.log(id, 'scrubbed', W, H);
}
