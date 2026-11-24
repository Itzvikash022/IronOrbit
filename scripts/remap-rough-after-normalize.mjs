// Remap rough-*.json preview boxes (1024-wide) for cover-normalized 2880x1440 floors.
import fs from 'node:fs';

const OUT_W = 2880;
const OUT_H = 1440;
const PREV_W = 1024;
const PRE = {
  dunes: { w: 2752, h: 1536 },
  glacier: { w: 2750, h: 1536 },
  magma: { w: 2894, h: 1440 },
  storm: { w: 2752, h: 1536 },
};

function remapPrev(box, preW, preH) {
  const K = OUT_W / PREV_W;
  const [a, b, c, d] = box;
  // preview -> old world
  const ox0 = a * K;
  const oy0 = b * K;
  const ox1 = c * K;
  const oy1 = d * K;
  const scale = Math.max(OUT_W / preW, OUT_H / preH);
  const sw = OUT_W / scale;
  const sh = OUT_H / scale;
  const sx0 = (preW - sw) / 2;
  const sy0 = (preH - sh) / 2;
  const toNew = (wx, wy) => {
    const xSrc = (wx * preW) / OUT_W;
    const ySrc = (wy * preH) / OUT_H;
    return [(xSrc - sx0) * scale, (ySrc - sy0) * scale];
  };
  const [nx0, ny0] = toNew(ox0, oy0);
  const [nx1, ny1] = toNew(ox1, oy1);
  return [
    Math.round((nx0 / OUT_W) * PREV_W),
    Math.round((ny0 / OUT_W) * PREV_W),
    Math.round((nx1 / OUT_W) * PREV_W),
    Math.round((ny1 / OUT_W) * PREV_W),
  ];
}

for (const id of Object.keys(PRE)) {
  const path = `scripts/rough-${id}.json`;
  const boxes = JSON.parse(fs.readFileSync(path, 'utf8'));
  const out = boxes.map((b) => remapPrev(b, PRE[id].w, PRE[id].h));
  fs.writeFileSync(path, JSON.stringify(out, null, 2) + '\n');
  console.log(id, out.length);
}
