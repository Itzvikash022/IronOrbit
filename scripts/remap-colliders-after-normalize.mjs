// Remap curated obstacle AABBs from pre-normalize anisotropic stretch into post-cover-crop 2880x1440 space.
// Pre sizes were: dunes/storm 2752x1536, glacier 2750x1536, magma 2894x1440.
import fs from 'node:fs';

const OUT_W = 2880;
const OUT_H = 1440;
const PRE = {
  dunes: { w: 2752, h: 1536 },
  glacier: { w: 2750, h: 1536 },
  magma: { w: 2894, h: 1440 },
  storm: { w: 2752, h: 1536 },
};

function remapBox(o, preW, preH) {
  const scale = Math.max(OUT_W / preW, OUT_H / preH);
  const sw = OUT_W / scale;
  const sh = OUT_H / scale;
  const sx0 = (preW - sw) / 2;
  const sy0 = (preH - sh) / 2;
  // old world -> source px (anisotropic)
  const x0 = (o.x * preW) / OUT_W;
  const y0 = (o.y * preH) / OUT_H;
  const x1 = ((o.x + o.w) * preW) / OUT_W;
  const y1 = ((o.y + o.h) * preH) / OUT_H;
  // source px -> new world (cover)
  const nx0 = (x0 - sx0) * scale;
  const ny0 = (y0 - sy0) * scale;
  const nx1 = (x1 - sx0) * scale;
  const ny1 = (y1 - sy0) * scale;
  return {
    ...o,
    x: Math.round(Math.max(0, Math.min(OUT_W - 4, nx0))),
    y: Math.round(Math.max(0, Math.min(OUT_H - 4, ny0))),
    w: Math.max(8, Math.round(nx1 - nx0)),
    h: Math.max(8, Math.round(ny1 - ny0)),
  };
}

const cur = JSON.parse(fs.readFileSync('scripts/terrain-obstacles-curated.json', 'utf8'));
for (const id of Object.keys(PRE)) {
  const pre = PRE[id];
  cur[id] = (cur[id] || []).map((o) => remapBox(o, pre.w, pre.h));
  console.log(id, cur[id].length);
}
fs.writeFileSync('scripts/terrain-obstacles-curated.json', JSON.stringify(cur, null, 2) + '\n');
console.log('remapped');
