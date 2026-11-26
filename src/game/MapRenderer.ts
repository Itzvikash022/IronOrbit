import Phaser from 'phaser';
import { ArenaMap, GameMode, Obstacle } from '../shared/types';

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rad = Math.max(0, Math.min(r, w * 0.5, h * 0.5));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function hashObs(id: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export class MapRenderer {
  private layer: Phaser.GameObjects.Container;
  private bakedImage: Phaser.GameObjects.Image | null = null;
  private currentBakeKey = '';

  constructor(private scene: Phaser.Scene) {
    this.layer = scene.add.container(0, 0);
    this.layer.setDepth(0);
  }

  render(map: ArenaMap, mode: GameMode): void {
    const bakeKey = `arena_baked_${map.id}_${mode}`;
    if (bakeKey === this.currentBakeKey && this.bakedImage && this.scene.textures.exists(bakeKey)) {
      return;
    }

    this.layer.removeAll(true);
    this.bakedImage = null;
    if (this.currentBakeKey && this.scene.textures.exists(this.currentBakeKey)) {
      this.scene.textures.remove(this.currentBakeKey);
    }
    this.currentBakeKey = bakeKey;

    if (this.scene.textures.exists(bakeKey)) {
      this.scene.textures.remove(bakeKey);
    }

    const tex = this.scene.textures.createCanvas(bakeKey, map.width, map.height);
    if (!tex) return;
    const ctx = tex.getContext();
    ctx.clearRect(0, 0, map.width, map.height);

    // 1. Ground surface — full custom artwork for bakedFloor terrain maps, floor plate for obstacle beta maps, seamless tile for classics
    const floorKey = `floor_${map.id}`;
    const hasCustomFloor = this.scene.textures.exists(floorKey);
    if (hasCustomFloor) {
      ctx.fillStyle = map.palette.groundBase;
      ctx.fillRect(0, 0, map.width, map.height);
      const src = this.scene.textures.get(floorKey).getSourceImage() as CanvasImageSource;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(src, 0, 0, map.width, map.height);

      if (!map.bakedFloor) {
        // Subtle tactical vignette for obstacle beta maps so tanks and shells read crisply
        const vig = ctx.createRadialGradient(
          map.width * 0.5,
          map.height * 0.5,
          map.height * 0.35,
          map.width * 0.5,
          map.height * 0.5,
          map.width * 0.65
        );
        vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vig.addColorStop(1, 'rgba(8, 12, 18, 0.22)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, map.width, map.height);
      }
    } else {
      const tileKey = `tile_${map.id}`;
      ctx.fillStyle = map.palette.groundBase;
      ctx.fillRect(0, 0, map.width, map.height);
      if (this.scene.textures.exists(tileKey)) {
        const tileSrc = this.scene.textures.get(tileKey).getSourceImage() as CanvasImageSource;
        const pattern = ctx.createPattern(tileSrc, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, map.width, map.height);
        }
      }
    }

    // 2. Subtle tactical grid (omitted on bakedFloor custom artwork maps)
    if (!map.bakedFloor) {
      ctx.strokeStyle = hasCustomFloor ? 'rgba(255, 255, 255, 0.032)' : 'rgba(255, 255, 255, 0.045)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 150; x < map.width; x += 150) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, map.height);
      }
      for (let y = 150; y < map.height; y += 150) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(map.width, y + 0.5);
      }
      ctx.stroke();
    }

    // 3. CTF Team Base Zones
    if (mode === 'ctf') {
      this.drawBaseZone(ctx, map.redBase.x, map.redBase.y, map.redBase.radius, '#ef4444', 'RED BASE');
      this.drawBaseZone(ctx, map.blueBase.x, map.blueBase.y, map.blueBase.radius, '#3b82f6', 'BLUE BASE');
    }

    // 4. Obstacles — bakedFloor terrain maps already have painted rocks/ruins in the artwork
    if (!map.bakedFloor) {
      for (const obs of map.obstacles) {
        this.drawObstacle(ctx, obs, map);
      }
    }

    // 5. Inner perimeter frame (kept strictly inside [0..map.width] x [0..map.height])
    if (map.bakedFloor) {
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, map.width - 4, map.height - 4);
    } else {
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, map.width - 10, map.height - 10);

      ctx.strokeStyle = 'rgba(245, 158, 11, 0.62)';
      ctx.lineWidth = 3;
      ctx.strokeRect(6, 6, map.width - 12, map.height - 12);
    }

    tex.refresh();

    this.bakedImage = this.scene.add.image(0, 0, bakeKey).setOrigin(0, 0);
    this.layer.add(this.bakedImage);
  }

  private drawBaseZone(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    hex: string,
    label: string
  ): void {
    ctx.save();
    ctx.fillStyle = hex === '#ef4444' ? 'rgba(239, 68, 68, 0.16)' : 'rgba(59, 130, 246, 0.16)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = hex === '#ef4444' ? 'rgba(239, 68, 68, 0.78)' : 'rgba(59, 130, 246, 0.78)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, radius - 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 14px Barlow Condensed, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y + radius - 18);
    ctx.restore();
  }

  private drawObstacle(
    ctx: CanvasRenderingContext2D,
    obs: Obstacle,
    map: ArenaMap
  ): void {
    const { x, y, w, h, kind } = obs;
    const fill = map.palette.obstacleFill;
    const stroke = map.palette.obstacleStroke;
    const top = map.palette.obstacleTop;
    const seed = hashObs(obs.id);

    const radius =
      kind === 'tree'
        ? Math.min(w, h) * 0.44
        : kind === 'lava_pillar'
          ? 12
          : kind === 'sandbag'
            ? 9
            : kind === 'ice_wall' || kind === 'rock'
              ? 8
              : kind === 'wreck' || kind === 'machinery'
                ? 5
                : 4;

    ctx.save();
    roundedRectPath(ctx, x, y, w, h, radius);
    ctx.clip();

    // Base fill
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);

    if (kind === 'tree') {
      const cx = x + w * 0.5;
      const cy = y + h * 0.5;
      const r = Math.min(w, h) * 0.5;

      // Full deep canopy shadow fill (eliminates brown wood corners)
      ctx.fillStyle = '#183d1f';
      ctx.fillRect(x, y, w, h);

      // Dense outer leaf rim filling the exact clipped silhouette
      const outerLobes: Array<[number, number, number, string]> = [
        [-0.45, -0.35, 0.52, '#215429'],
        [0.45, -0.35, 0.52, '#215429'],
        [-0.45, 0.35, 0.52, '#1c4723'],
        [0.45, 0.35, 0.52, '#1c4723'],
        [0, -0.48, 0.52, '#286431'],
        [0, 0.48, 0.5, '#1e4e26'],
        [-0.48, 0, 0.5, '#245c2c'],
        [0.48, 0, 0.5, '#245c2c'],
      ];
      for (const [ox, oy, rr, col] of outerLobes) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(cx + ox * r, cy + oy * r, rr * r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Upper sculpted foliage tiers + sunlit crown highlights
      const crownLobes: Array<[number, number, number, string]> = [
        [-0.22, -0.18, 0.46, '#2f7a39'],
        [0.24, -0.14, 0.44, '#2d7236'],
        [-0.18, 0.22, 0.42, '#286631'],
        [0.2, 0.2, 0.42, '#286631'],
        [-0.08, -0.08, 0.48, '#3c9446'],
        [-0.14, -0.2, 0.32, '#55b35e'],
      ];
      for (const [ox, oy, rr, col] of crownLobes) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(cx + ox * r, cy + oy * r, rr * r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(12, 34, 16, 0.45)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      // Sunlit leaf dapples
      ctx.fillStyle = 'rgba(220, 252, 231, 0.18)';
      ctx.beginPath();
      ctx.arc(cx - r * 0.18, cy - r * 0.24, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 'container') {
      // Top bevel highlight + bottom shadow
      ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.fillRect(x, y, w, Math.max(6, h * 0.16));
      ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
      ctx.fillRect(x, y + h - Math.max(6, h * 0.18), w, Math.max(6, h * 0.18));

      // Corrugated steel ribs
      ctx.lineWidth = 2;
      if (w >= h) {
        for (let rx = x + 12; rx < x + w - 8; rx += 11) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.beginPath();
          ctx.moveTo(rx, y + 4);
          ctx.lineTo(rx, y + h - 4);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.beginPath();
          ctx.moveTo(rx + 2, y + 4);
          ctx.lineTo(rx + 2, y + h - 4);
          ctx.stroke();
        }
      } else {
        for (let ry = y + 12; ry < y + h - 8; ry += 11) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.beginPath();
          ctx.moveTo(x + 4, ry);
          ctx.lineTo(x + w - 4, ry);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.beginPath();
          ctx.moveTo(x + 4, ry + 2);
          ctx.lineTo(x + w - 4, ry + 2);
          ctx.stroke();
        }
      }

      // Central locking plate & corner castings
      ctx.fillStyle = stroke;
      ctx.fillRect(x + w * 0.36, y + h * 0.36, w * 0.28, h * 0.28);
      ctx.fillStyle = top;
      ctx.fillRect(x + 2, y + 2, 10, 10);
      ctx.fillRect(x + w - 12, y + 2, 10, 10);
      ctx.fillRect(x + 2, y + h - 12, 10, 10);
      ctx.fillRect(x + w - 12, y + h - 12, 10, 10);
    } else if (kind === 'lava_pillar') {
      // Dark volcanic obsidian crust with glowing magma core veins
      ctx.fillStyle = '#251412';
      ctx.fillRect(x, y, w, h);

      const cx = x + w * 0.5;
      const cy = y + h * 0.5;
      const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, Math.max(w, h) * 0.55);
      glow.addColorStop(0, 'rgba(251, 146, 60, 0.55)');
      glow.addColorStop(0.55, 'rgba(234, 88, 12, 0.25)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x, y, w, h);

      // Glowing obsidian fissure cracks
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + 10, y + 12);
      ctx.lineTo(cx - 4, cy);
      ctx.lineTo(x + w - 10, y + h - 12);
      ctx.moveTo(x + w - 12, y + 14);
      ctx.lineTo(cx + 4, cy);
      ctx.lineTo(x + 12, y + h - 14);
      ctx.stroke();

      ctx.fillStyle = '#ea580c';
      roundedRectPath(ctx, cx - Math.min(w, h) * 0.16, cy - Math.min(w, h) * 0.16, Math.min(w, h) * 0.32, Math.min(w, h) * 0.32, 6);
      ctx.fill();
    } else if (kind === 'sandbag') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(x, y, w, h);
      const stepX = Math.max(14, Math.min(22, w * 0.44));
      const stepY = Math.max(12, Math.min(18, h * 0.44));
      let row = 0;
      for (let sy = y + 3; sy < y + h - 6; sy += stepY) {
        const offset = (row % 2) * (stepX * 0.45);
        row += 1;
        for (let sx = x + 3 - offset; sx < x + w - 4; sx += stepX) {
          const bx = Math.max(x + 2, sx);
          const bw = Math.min(stepX - 3, x + w - 2 - bx);
          const bh = Math.min(stepY - 3, y + h - 2 - sy);
          if (bw < 6 || bh < 6) continue;
          ctx.fillStyle = top;
          roundedRectPath(ctx, bx, sy, bw, bh, 4);
          ctx.fill();
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.14)';
          ctx.fillRect(bx + 2, sy + 2, Math.max(2, bw - 4), 2);
        }
      }
    } else if (kind === 'bunker' || kind === 'building') {
      // Concrete roof slab bevels
      ctx.fillStyle = top;
      ctx.fillRect(x + 8, y + 8, w - 16, h - 16);
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.55)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 8, y + 8, w - 16, h - 16);

      // Panel seams & HVAC / steel hatch
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.5, y + 10);
      ctx.lineTo(x + w * 0.5, y + h - 10);
      ctx.moveTo(x + 10, y + h * 0.5);
      ctx.lineTo(x + w - 10, y + h * 0.5);
      ctx.stroke();

      // Reinforced center hatch
      ctx.fillStyle = stroke;
      ctx.beginPath();
      ctx.arc(x + w * 0.5, y + h * 0.5, Math.min(w, h) * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Corner rivets + caution marking
      ctx.fillStyle = 'rgba(251, 191, 36, 0.65)';
      ctx.fillRect(x + 8, y + 8, Math.min(20, w * 0.18), 4);
      ctx.fillRect(x + w - Math.min(20, w * 0.18) - 8, y + h - 12, Math.min(20, w * 0.18), 4);
    } else if (kind === 'barrier') {
      // Industrial hazard stripe barrier
      ctx.fillStyle = '#f59e0b';
      const stripe = Math.max(10, Math.min(w, h) * 0.28);
      for (let i = -h; i < w + h; i += stripe * 2) {
        ctx.beginPath();
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i + stripe, y);
        ctx.lineTo(x + i + stripe - h, y + h);
        ctx.lineTo(x + i - h, y + h);
        ctx.closePath();
        ctx.fill();
      }
      // Steel top flange bar
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      if (w >= h) {
        ctx.fillRect(x, y + h * 0.28, w, h * 0.44);
      } else {
        ctx.fillRect(x + w * 0.28, y, w * 0.44, h);
      }
    } else if (kind === 'ice_wall') {
      // Faceted crystalline glacial massif
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, top);
      grad.addColorStop(0.55, fill);
      grad.addColorStop(1, '#3b7394');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      // Internal glacier facets
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 4);
      ctx.lineTo(x + w * 0.72, y + 4);
      ctx.lineTo(x + w * 0.35, y + h * 0.55);
      ctx.lineTo(x + 4, y + h * 0.42);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x + 12, y + h - 12);
      ctx.lineTo(x + w * 0.5, y + h * 0.45);
      ctx.lineTo(x + w - 12, y + 14);
      ctx.stroke();
    } else if (kind === 'wreck' || kind === 'machinery') {
      ctx.fillStyle = top;
      ctx.globalAlpha = 0.65;
      roundedRectPath(ctx, x + 6, y + 6, w * 0.46, h * 0.42, 3);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Steel housing / hatch / cooling vents
      ctx.fillStyle = stroke;
      ctx.beginPath();
      ctx.arc(x + w * 0.7, y + h * 0.56, Math.min(w, h) * 0.18, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 10, y + h - 12);
      ctx.lineTo(x + w - 10, y + 12);
      ctx.stroke();

      if (kind === 'machinery') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
        const fins = 5;
        if (h >= w) {
          for (let i = 0; i < fins; i++) {
            ctx.fillRect(x + 8, y + 16 + i * ((h - 32) / fins), w - 16, 4);
          }
        } else {
          for (let i = 0; i < fins; i++) {
            ctx.fillRect(x + 16 + i * ((w - 32) / fins), y + 8, 4, h - 16);
          }
        }
      }
    } else if (kind === 'ruin') {
      // Top stone cap + masonry courses
      ctx.fillStyle = top;
      ctx.fillRect(x + 4, y + 4, w - 8, Math.max(12, h * 0.36));

      ctx.strokeStyle = 'rgba(20, 14, 8, 0.42)';
      ctx.lineWidth = 1.5;
      for (let row = y + 16; row < y + h - 6; row += 14) {
        ctx.beginPath();
        ctx.moveTo(x + 4, row);
        ctx.lineTo(x + w - 4, row);
        ctx.stroke();
      }
      // Chipped stone fracture
      ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
      ctx.beginPath();
      ctx.moveTo(x + w * 0.6, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h * 0.34);
      ctx.closePath();
      ctx.fill();
    } else {
      // Craggy faceted rock mesa strictly inside bounds
      const cx = x + w * 0.5;
      const cy = y + h * 0.5;
      ctx.fillStyle = top;
      ctx.beginPath();
      ctx.moveTo(x + 6, y + h * 0.55);
      ctx.lineTo(x + w * 0.38, y + 6);
      ctx.lineTo(x + w * 0.78, y + h * 0.32);
      ctx.lineTo(cx, cy + h * 0.08);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.moveTo(x + w * 0.42, y + h * 0.5);
      ctx.lineTo(x + w - 6, y + 10);
      ctx.lineTo(x + w - 6, y + h - 6);
      ctx.lineTo(x + w * 0.2, y + h - 6);
      ctx.closePath();
      ctx.fill();

      if (seed % 2 === 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 12, y + h * 0.62);
        ctx.lineTo(x + w - 12, y + h * 0.68);
        ctx.stroke();
      }
    }

    // Crisp outer border stroke completely contained inside clipped bounds
    roundedRectPath(ctx, x + 1.25, y + 1.25, Math.max(2, w - 2.5), Math.max(2, h - 2.5), radius);
    ctx.strokeStyle = kind === 'lava_pillar' ? '#f97316' : stroke;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.restore();
  }
}
