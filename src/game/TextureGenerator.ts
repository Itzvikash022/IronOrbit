import Phaser from 'phaser';
import { POWERUP_META, TANK_SKINS, TankSkinConfig } from '../shared/config';
import { ARENA_MAPS, MAP_IDS } from '../shared/maps';
import { PowerUpType } from '../shared/types';

function makeCanvas(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, width, height);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, width, height);
  draw(ctx, width, height);
  tex.refresh();
}

function drawTankHull(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  skin: TankSkinConfig,
  teamOutline?: string
): void {
  const cx = w / 2;
  const cy = h / 2;

  ctx.save();
  ctx.translate(cx, cy);

  // Subtle shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, -23, -18, 48, 38, 6);
  ctx.fill();

  // Left & Right armored tracks (tank faces +X = right)
  for (const ty of [-20, 11]) {
    ctx.fillStyle = '#181c22';
    roundRect(ctx, -23, ty, 46, 9, 3);
    ctx.fill();
    ctx.strokeStyle = '#0b0d11';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Track tread ribs
    ctx.fillStyle = '#2d343f';
    for (let tx = -19; tx <= 18; tx += 6) {
      ctx.fillRect(tx, ty + 1, 3, 7);
    }
  }

  // Main chassis body
  ctx.fillStyle = skin.body;
  roundRect(ctx, -20, -14, 40, 28, 5);
  ctx.fill();
  ctx.strokeStyle = teamOutline ?? '#111827';
  ctx.lineWidth = teamOutline ? 2.5 : 2;
  ctx.stroke();

  // Armor bevel highlight
  ctx.fillStyle = skin.highlight;
  roundRect(ctx, -17, -11, 34, 8, 3);
  ctx.fill();

  // Rear engine deck
  ctx.fillStyle = skin.dark;
  roundRect(ctx, -18, -9, 11, 18, 2);
  ctx.fill();
  ctx.fillStyle = '#111827';
  for (let gy = -6; gy <= 5; gy += 4) {
    ctx.fillRect(-16, gy, 7, 2);
  }

  // Forward directional chevron so auto-rotation facing is crystal clear
  ctx.fillStyle = skin.trim;
  ctx.beginPath();
  ctx.moveTo(19, 0);
  ctx.lineTo(10, -7);
  ctx.lineTo(12, 0);
  ctx.lineTo(10, 7);
  ctx.closePath();
  ctx.fill();

  // Corner rivets
  ctx.fillStyle = '#e2e8f0';
  for (const [rx, ry] of [
    [-16, -11],
    [-16, 11],
    [15, -11],
    [15, 11],
  ]) {
    ctx.beginPath();
    ctx.arc(rx, ry, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawTankTurret(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  skin: TankSkinConfig
): void {
  const cx = w / 2;
  const cy = h / 2;

  ctx.save();
  ctx.translate(cx, cy);

  // Cannon barrel extending +X
  ctx.fillStyle = skin.dark;
  roundRect(ctx, 4, -4.5, 26, 9, 2);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Barrel highlight strip
  ctx.fillStyle = skin.highlight;
  ctx.fillRect(6, -2.5, 21, 2.5);

  // Muzzle brake
  ctx.fillStyle = '#1e293b';
  roundRect(ctx, 26, -5.5, 6, 11, 1.5);
  ctx.fill();
  ctx.strokeStyle = '#090d16';
  ctx.stroke();

  // Turret cupola
  ctx.fillStyle = skin.body;
  ctx.beginPath();
  ctx.arc(0, 0, 12.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner hatch ring
  ctx.fillStyle = skin.dark;
  ctx.beginPath();
  ctx.arc(-2, 0, 6.5, 0, Math.PI * 2);
  ctx.fill();

  // Trim stripe
  ctx.fillStyle = skin.trim;
  ctx.fillRect(4, -2, 6, 4);

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function generateGameTextures(scene: Phaser.Scene): void {
  // 1. 7 Tank Skins + Red/Blue CTF Team Variants
  TANK_SKINS.forEach((skin) => {
    makeCanvas(scene, `tank_hull_${skin.id}`, 64, 64, (ctx, w, h) =>
      drawTankHull(ctx, w, h, skin)
    );
    makeCanvas(scene, `tank_turret_${skin.id}`, 72, 48, (ctx, w, h) =>
      drawTankTurret(ctx, w, h, skin)
    );
  });

  const redTeamSkin: TankSkinConfig = {
    id: 98,
    name: 'Red Division',
    body: '#dc2626',
    dark: '#7f1d1d',
    highlight: '#f87171',
    trim: '#fde047',
  };
  const blueTeamSkin: TankSkinConfig = {
    id: 99,
    name: 'Blue Division',
    body: '#2563eb',
    dark: '#1e3a8a',
    highlight: '#60a5fa',
    trim: '#fde047',
  };

  makeCanvas(scene, 'tank_hull_red', 64, 64, (ctx, w, h) =>
    drawTankHull(ctx, w, h, redTeamSkin, '#fecaca')
  );
  makeCanvas(scene, 'tank_turret_red', 72, 48, (ctx, w, h) =>
    drawTankTurret(ctx, w, h, redTeamSkin)
  );
  makeCanvas(scene, 'tank_hull_blue', 64, 64, (ctx, w, h) =>
    drawTankHull(ctx, w, h, blueTeamSkin, '#bfdbfe')
  );
  makeCanvas(scene, 'tank_turret_blue', 72, 48, (ctx, w, h) =>
    drawTankTurret(ctx, w, h, blueTeamSkin)
  );

  // 2. Projectiles (wider shells so they read clearly at full-map zoom)
  makeCanvas(scene, 'proj_normal', 48, 22, (ctx) => {
    ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.beginPath();
    ctx.ellipse(18, 11, 16, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fbbf24';
    roundRect(ctx, 8, 5, 32, 12, 6);
    ctx.fill();

    ctx.fillStyle = '#fef3c7';
    roundRect(ctx, 22, 7, 14, 8, 4);
    ctx.fill();
  });

  makeCanvas(scene, 'proj_double', 52, 26, (ctx) => {
    ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.beginPath();
    ctx.ellipse(20, 13, 18, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    roundRect(ctx, 8, 5, 36, 16, 7);
    ctx.fill();

    ctx.fillStyle = '#fee2e2';
    roundRect(ctx, 24, 8, 16, 10, 5);
    ctx.fill();
  });

  // 3. Particles & Muzzle Flash
  makeCanvas(scene, 'particle_spark', 16, 16, (ctx) => {
    const grad = ctx.createRadialGradient(8, 8, 1, 8, 8, 8);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.45, '#fbbf24');
    grad.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
  });

  makeCanvas(scene, 'particle_smoke', 24, 24, (ctx) => {
    const grad = ctx.createRadialGradient(12, 12, 2, 12, 12, 12);
    grad.addColorStop(0, 'rgba(148, 163, 184, 0.65)');
    grad.addColorStop(1, 'rgba(71, 85, 105, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 24, 24);
  });

  makeCanvas(scene, 'muzzle_flash', 32, 24, (ctx) => {
    ctx.fillStyle = 'rgba(251, 146, 60, 0.55)';
    ctx.beginPath();
    ctx.moveTo(2, 12);
    ctx.lineTo(18, 3);
    ctx.lineTo(30, 12);
    ctx.lineTo(18, 21);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(4, 12);
    ctx.lineTo(16, 7);
    ctx.lineTo(24, 12);
    ctx.lineTo(16, 17);
    ctx.closePath();
    ctx.fill();
  });

  // 4. Shield Ring
  makeCanvas(scene, 'shield_ring', 68, 68, (ctx) => {
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.9)';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 6]);
    ctx.beginPath();
    ctx.arc(34, 34, 29, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(186, 230, 253, 0.4)';
    ctx.lineWidth = 6;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(34, 34, 26, 0, Math.PI * 2);
    ctx.stroke();
  });

  // 5. Supply Crate Base + 7 Power-Up Icons
  makeCanvas(scene, 'crate_base', 40, 40, (ctx) => {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    roundRect(ctx, 4, 6, 34, 34, 6);
    ctx.fill();

    ctx.fillStyle = '#292524';
    roundRect(ctx, 2, 2, 36, 36, 6);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#44403c';
    roundRect(ctx, 6, 6, 28, 28, 4);
    ctx.fill();
  });

  const powerTypes = Object.keys(POWERUP_META) as PowerUpType[];
  for (const pType of powerTypes) {
    const meta = POWERUP_META[pType];
    makeCanvas(scene, `icon_${pType}`, 28, 28, (ctx) => {
      ctx.fillStyle = meta.color;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;

      if (pType === 'speed') {
        // Double lightning chevron
        ctx.beginPath();
        ctx.moveTo(6, 7);
        ctx.lineTo(14, 14);
        ctx.lineTo(6, 21);
        ctx.lineTo(10, 21);
        ctx.lineTo(18, 14);
        ctx.lineTo(10, 7);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(14, 7);
        ctx.lineTo(22, 14);
        ctx.lineTo(14, 21);
        ctx.lineTo(18, 21);
        ctx.lineTo(25, 14);
        ctx.lineTo(18, 7);
        ctx.closePath();
        ctx.fill();
      } else if (pType === 'infinite_ammo') {
        ctx.strokeStyle = meta.color;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.arc(9.5, 14, 4.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(18.5, 14, 4.5, 0, Math.PI * 2);
        ctx.stroke();
      } else if (pType === 'shield') {
        ctx.beginPath();
        ctx.moveTo(14, 4);
        ctx.lineTo(23, 8);
        ctx.lineTo(21, 18);
        ctx.lineTo(14, 24);
        ctx.lineTo(7, 18);
        ctx.lineTo(5, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (pType === 'rapid_fire') {
        for (const bx of [6, 12.5, 19]) {
          roundRect(ctx, bx, 6, 4, 16, 2);
          ctx.fill();
        }
      } else if (pType === 'double_damage') {
        ctx.font = 'bold 14px Barlow Condensed, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('2X', 14, 15);
      } else if (pType === 'health_restore') {
        ctx.fillRect(11, 5, 6, 18);
        ctx.fillRect(5, 11, 18, 6);
      } else if (pType === 'extra_ammo') {
        ctx.fillRect(6, 8, 5, 13);
        ctx.fillRect(12, 8, 5, 13);
        ctx.fillRect(18, 8, 5, 13);
      } else if (pType === 'terrain_boost') {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i - Math.PI / 6;
          const px = 14 + Math.cos(a) * 10;
          const py = 14 + Math.sin(a) * 10;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px Barlow Condensed, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('3', 14, 15);
      }
    });
  }

  // 6. Flags (Red & Blue)
  for (const team of ['red', 'blue'] as const) {
    const flagColor = team === 'red' ? '#ef4444' : '#3b82f6';
    const flagLight = team === 'red' ? '#fca5a5' : '#93c5fd';
    makeCanvas(scene, `flag_${team}`, 44, 48, (ctx) => {
      // Ground shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(16, 42, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flagpole
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(12, 6, 4, 36);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(12, 6, 4, 36);

      // Pennant banner
      ctx.fillStyle = flagColor;
      ctx.beginPath();
      ctx.moveTo(16, 8);
      ctx.lineTo(40, 14);
      ctx.lineTo(34, 21);
      ctx.lineTo(40, 27);
      ctx.lineTo(16, 27);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = flagLight;
      ctx.fillRect(18, 12, 12, 3);

      // Finial orb
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(14, 6, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // 7. 7 Biome Terrain Tile Textures (256x256 rich seamless variation)
  for (const id of MAP_IDS) {
    const map = ARENA_MAPS[id];
    makeCanvas(scene, `tile_${id}`, 256, 256, (ctx) => {
      ctx.fillStyle = map.palette.groundBase;
      ctx.fillRect(0, 0, 256, 256);

      // Deterministic pseudo-random scatter per biome
      const rand = (seed: number) => {
        const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
        return x - Math.floor(x);
      };

      ctx.fillStyle = map.palette.groundDetail;
      if (id === 'desert') {
        for (let i = 0; i < 16; i++) {
          const rx = rand(i + 1) * 220;
          const ry = rand(i + 40) * 240;
          ctx.fillRect(rx, ry, 28 + rand(i + 80) * 34, 4);
        }
        ctx.fillStyle = map.palette.groundAccent;
        for (let i = 0; i < 12; i++) {
          ctx.beginPath();
          ctx.arc(rand(i + 100) * 240 + 8, rand(i + 150) * 240 + 8, 2 + rand(i + 200) * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (id === 'industrial') {
        for (let gx = 0; gx < 256; gx += 128) {
          for (let gy = 0; gy < 256; gy += 128) {
            ctx.fillStyle = (gx + gy) % 256 === 0 ? map.palette.groundDetail : map.palette.groundBase;
            ctx.fillRect(gx + 2, gy + 2, 124, 124);
            ctx.strokeStyle = 'rgba(255,255,255,0.045)';
            ctx.strokeRect(gx + 2, gy + 2, 124, 124);
            ctx.fillStyle = 'rgba(148,163,184,0.16)';
            ctx.fillRect(gx + 8, gy + 8, 3, 3);
            ctx.fillRect(gx + 117, gy + 8, 3, 3);
            ctx.fillRect(gx + 8, gy + 117, 3, 3);
            ctx.fillRect(gx + 117, gy + 117, 3, 3);
          }
        }
      } else if (id === 'forest') {
        for (let i = 0; i < 24; i++) {
          ctx.fillStyle = i % 3 === 0 ? map.palette.groundAccent : map.palette.groundDetail;
          ctx.beginPath();
          ctx.arc(rand(i + 1) * 244 + 6, rand(i + 50) * 244 + 6, 4 + rand(i + 90) * 10, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (id === 'frozen') {
        ctx.fillStyle = map.palette.groundDetail;
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.ellipse(rand(i + 10) * 210 + 20, rand(i + 30) * 210 + 20, 26 + rand(i + 60) * 22, 14 + rand(i + 90) * 12, rand(i) * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = map.palette.groundAccent;
        ctx.lineWidth = 1.4;
        for (let i = 0; i < 5; i++) {
          const sx = rand(i + 120) * 200 + 20;
          const sy = rand(i + 140) * 200 + 20;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + (rand(i + 160) - 0.5) * 60, sy + (rand(i + 180) - 0.5) * 60);
          ctx.stroke();
        }
      } else if (id === 'city') {
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, 128, 128);
        ctx.strokeRect(128, 128, 128, 128);
        ctx.fillStyle = map.palette.groundDetail;
        for (let i = 0; i < 14; i++) {
          ctx.fillRect(rand(i + 1) * 240, rand(i + 30) * 240, 6 + rand(i + 60) * 8, 4);
        }
      } else if (id === 'outpost') {
        ctx.fillStyle = map.palette.groundDetail;
        ctx.fillRect(10, 10, 108, 108);
        ctx.fillRect(138, 138, 108, 108);
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.strokeRect(10, 10, 108, 108);
        ctx.strokeRect(138, 138, 108, 108);
      } else if (id === 'dunes') {
        // Soft wind-rippled sand
        ctx.lineWidth = 2;
        for (let i = 0; i < 7; i++) {
          const y0 = 18 + i * 36 + rand(i + 3) * 10;
          ctx.strokeStyle = i % 2 === 0 ? map.palette.groundDetail : map.palette.groundAccent;
          ctx.beginPath();
          for (let x = 0; x <= 256; x += 8) {
            const y = y0 + Math.sin((x / 256) * Math.PI * 2 + i) * 5;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.fillStyle = map.palette.groundAccent;
        for (let i = 0; i < 18; i++) {
          ctx.fillRect(rand(i + 300) * 250, rand(i + 340) * 250, 2, 2);
        }
      } else if (id === 'glacier') {
        ctx.fillStyle = map.palette.groundAccent;
        for (let i = 0; i < 5; i++) {
          ctx.globalAlpha = 0.55;
          ctx.beginPath();
          ctx.ellipse(rand(i + 11) * 220 + 18, rand(i + 31) * 220 + 18, 30 + rand(i + 61) * 26, 12 + rand(i + 91) * 10, rand(i + 5) * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1.3;
        for (let i = 0; i < 7; i++) {
          let sx = rand(i + 200) * 240 + 8;
          let sy = rand(i + 220) * 240 + 8;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          for (let s = 0; s < 3; s++) {
            sx += (rand(i * 7 + s + 240) - 0.4) * 40;
            sy += (rand(i * 7 + s + 260) - 0.5) * 40;
            ctx.lineTo(sx, sy);
          }
          ctx.stroke();
        }
      } else if (id === 'magma') {
        ctx.fillStyle = map.palette.groundAccent;
        for (let i = 0; i < 12; i++) {
          const cx = rand(i + 7) * 230 + 12;
          const cy = rand(i + 27) * 230 + 12;
          const r = 12 + rand(i + 47) * 18;
          ctx.beginPath();
          for (let k = 0; k < 6; k++) {
            const a = (k / 6) * Math.PI * 2;
            const px = cx + Math.cos(a) * r;
            const py = cy + Math.sin(a) * r;
            if (k === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
        }
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.28)';
        ctx.lineWidth = 1.6;
        for (let i = 0; i < 4; i++) {
          let sx = rand(i + 400) * 256;
          let sy = rand(i + 420) * 256;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          for (let s = 0; s < 4; s++) {
            sx += (rand(i * 5 + s + 440) - 0.5) * 70;
            sy += (rand(i * 5 + s + 460) - 0.5) * 70;
            ctx.lineTo(sx, sy);
          }
          ctx.stroke();
        }
      } else if (id === 'storm') {
        // Wind-combed grass streaks
        ctx.lineWidth = 2;
        for (let i = 0; i < 34; i++) {
          const sx = rand(i + 1) * 250;
          const sy = rand(i + 60) * 250;
          ctx.strokeStyle = i % 3 === 0 ? map.palette.groundAccent : map.palette.groundDetail;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + 12 + rand(i + 120) * 10, sy - 4 - rand(i + 160) * 5);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.ellipse(rand(i + 500) * 240 + 8, rand(i + 520) * 240 + 8, 18, 9, 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (id === 'sentinel') {
        // Concrete slabs with expansion joints and hazard-stripe studs
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, 126, 126);
        ctx.strokeRect(129, 1, 126, 126);
        ctx.strokeRect(1, 129, 126, 126);
        ctx.strokeRect(129, 129, 126, 126);
        ctx.fillStyle = map.palette.groundAccent;
        for (let i = 0; i < 10; i++) {
          ctx.fillRect(rand(i + 3) * 240 + 6, rand(i + 33) * 240 + 6, 3, 3);
        }
        ctx.fillStyle = 'rgba(250, 204, 21, 0.22)';
        for (let k = 0; k < 4; k++) {
          ctx.fillRect(10 + k * 10, 120, 6, 4);
        }
      } else if (id === 'overgrowth') {
        for (let i = 0; i < 30; i++) {
          ctx.fillStyle = i % 3 === 0 ? map.palette.groundAccent : map.palette.groundDetail;
          ctx.beginPath();
          ctx.ellipse(rand(i + 2) * 250 + 3, rand(i + 52) * 250 + 3, 3 + rand(i + 92) * 7, 2 + rand(i + 132) * 4, rand(i + 172) * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = map.palette.groundAccent;
        ctx.lineWidth = 1.3;
        for (let i = 0; i < 16; i++) {
          const sx = rand(i + 600) * 250;
          const sy = rand(i + 640) * 250;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + (rand(i + 680) - 0.5) * 8, sy - 6 - rand(i + 720) * 5);
          ctx.stroke();
        }
      } else if (id === 'blastyard') {
        ctx.fillStyle = map.palette.groundAccent;
        for (let i = 0; i < 30; i++) {
          ctx.fillRect(rand(i + 4) * 252, rand(i + 44) * 252, 2 + rand(i + 84) * 2, 2);
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.22)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, 70);
        ctx.lineTo(256, 84);
        ctx.moveTo(0, 150);
        ctx.lineTo(256, 164);
        ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.20)';
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.arc(rand(i + 800) * 230 + 12, rand(i + 820) * 230 + 12, 10 + rand(i + 840) * 12, 0, Math.PI * 2);
          ctx.fill();
        }      } else if (id === 'lava') {
        ctx.fillStyle = map.palette.groundDetail;
        for (let i = 0; i < 10; i++) {
          ctx.beginPath();
          ctx.arc(rand(i + 5) * 230 + 12, rand(i + 25) * 230 + 12, 10 + rand(i + 45) * 18, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = 'rgba(234, 88, 12, 0.34)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 74);
        ctx.lineTo(68, 106);
        ctx.lineTo(148, 84);
        ctx.lineTo(256, 126);
        ctx.moveTo(110, 0);
        ctx.lineTo(132, 92);
        ctx.lineTo(96, 188);
        ctx.lineTo(142, 256);
        ctx.stroke();
      }
    });
  }
}
