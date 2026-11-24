import Phaser from 'phaser';
import { ArenaMap, GameMode, Obstacle } from '../shared/types';

export class MapRenderer {
  private layer: Phaser.GameObjects.Container;

  constructor(private scene: Phaser.Scene) {
    this.layer = scene.add.container(0, 0);
    this.layer.setDepth(0);
  }

  render(map: ArenaMap, mode: GameMode): void {
    this.layer.removeAll(true);

    // 1. Floor — baked full-arena art when available, else procedural tile (map-only, no margin)
    const floorKey = `floor_${map.id}`;
    const useBaked = Boolean(map.bakedFloor && this.scene.textures.exists(floorKey));
    if (useBaked) {
      const base = this.scene.add.rectangle(
        map.width / 2,
        map.height / 2,
        map.width,
        map.height,
        Phaser.Display.Color.HexStringToColor(map.palette.groundBase).color
      );
      this.layer.add(base);
      // Uniform cover: no anisotropic stretch so painted rocks match collision AABBs.
      const src = this.scene.textures.get(floorKey).getSourceImage() as HTMLImageElement;
      const cover = Math.max(map.width / src.width, map.height / src.height);
      const floor = this.scene.add
        .image(map.width / 2, map.height / 2, floorKey)
        .setDisplaySize(src.width * cover, src.height * cover);
      this.layer.add(floor);
    } else {
      const tile = this.scene.add.tileSprite(
        map.width / 2,
        map.height / 2,
        map.width,
        map.height,
        `tile_${map.id}`
      );
      this.layer.add(tile);
    }

    // 2. Arena Boundary Frame & Subtle Grid
    const g = this.scene.add.graphics();
    if (!useBaked) {
      g.lineStyle(1, 0xffffff, 0.045);
      for (let x = 150; x < map.width; x += 150) {
        g.lineBetween(x, 0, x, map.height);
      }
      for (let y = 150; y < map.height; y += 150) {
        g.lineBetween(0, y, map.width, y);
      }
    }

    // Perimeter reinforced border
    g.lineStyle(10, 0x0f172a, 0.9);
    g.strokeRect(0, 0, map.width, map.height);
    g.lineStyle(3, 0xf59e0b, 0.55);
    g.strokeRect(4, 4, map.width - 8, map.height - 8);
    this.layer.add(g);

    // 3. CTF Team Base Zones
    if (mode === 'ctf') {
      this.drawBaseZone(map.redBase.x, map.redBase.y, map.redBase.radius, 0xef4444, 'RED BASE');
      this.drawBaseZone(map.blueBase.x, map.blueBase.y, map.blueBase.radius, 0x3b82f6, 'BLUE BASE');
    }

    // 4. Obstacles — skip drawing when art is baked into the floor image (collision still active)
    if (!useBaked) {
      for (const obs of map.obstacles) {
        this.drawObstacle(obs, map);
      }
    }
  }

  private drawBaseZone(
    x: number,
    y: number,
    radius: number,
    color: number,
    label: string
  ): void {
    const g = this.scene.add.graphics();
    g.fillStyle(color, 0.14);
    g.fillCircle(x, y, radius);
    g.lineStyle(3, color, 0.7);
    g.strokeCircle(x, y, radius);
    g.lineStyle(1.5, 0xffffff, 0.35);
    g.strokeCircle(x, y, radius - 10);
    this.layer.add(g);

    const txt = this.scene.add
      .text(x, y + radius - 18, label, {
        fontFamily: 'Barlow Condensed, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setAlpha(0.75);
    this.layer.add(txt);
  }

  private drawObstacle(obs: Obstacle, map: ArenaMap): void {
    const g = this.scene.add.graphics();
    const fill = Phaser.Display.Color.HexStringToColor(map.palette.obstacleFill).color;
    const stroke = Phaser.Display.Color.HexStringToColor(map.palette.obstacleStroke).color;
    const top = Phaser.Display.Color.HexStringToColor(map.palette.obstacleTop).color;
    const { x, y, w, h } = obs;

    // Soft contact shadow (kept inside AABB footprint so visuals match collision)
    g.fillStyle(0x000000, 0.28);
    g.fillRoundedRect(x + 3, y + 4, w - 2, h - 2, 5);

    if (obs.kind === 'tree') {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const r = Math.min(w, h) * 0.46;
      g.fillStyle(0x5c4030, 1);
      g.fillCircle(cx, cy + r * 0.08, r * 0.28);
      g.fillStyle(fill, 1);
      g.fillCircle(cx - r * 0.22, cy - r * 0.1, r * 0.55);
      g.fillCircle(cx + r * 0.2, cy - r * 0.05, r * 0.5);
      g.fillStyle(top, 1);
      g.fillCircle(cx, cy - r * 0.18, r * 0.72);
      g.lineStyle(2, stroke, 0.9);
      g.strokeCircle(cx, cy - r * 0.12, r * 0.78);
      g.fillStyle(0xffffff, 0.12);
      g.fillCircle(cx - r * 0.2, cy - r * 0.35, r * 0.22);
    } else if (obs.kind === 'container') {
      g.fillStyle(fill, 1);
      g.fillRoundedRect(x, y, w, h, 3);
      g.lineStyle(2.5, stroke, 1);
      g.strokeRoundedRect(x, y, w, h, 3);
      g.fillStyle(top, 0.55);
      g.fillRect(x + 4, y + 3, w - 8, Math.max(6, h * 0.18));
      g.lineStyle(2, top, 0.7);
      if (w >= h) {
        for (let rx = x + 12; rx < x + w - 8; rx += 11) g.lineBetween(rx, y + 4, rx, y + h - 4);
      } else {
        for (let ry = y + 12; ry < y + h - 8; ry += 11) g.lineBetween(x + 4, ry, x + w - 4, ry);
      }
      g.fillStyle(stroke, 0.55);
      g.fillRoundedRect(x + w * 0.35, y + h * 0.38, w * 0.3, h * 0.24, 2);
    } else if (obs.kind === 'lava_pillar') {
      g.fillStyle(fill, 1);
      g.fillRoundedRect(x, y, w, h, 12);
      g.lineStyle(3, 0xf97316, 0.85);
      g.strokeRoundedRect(x, y, w, h, 12);
      g.fillStyle(0xea580c, 0.45);
      g.fillRoundedRect(x + 12, y + 12, w - 24, h - 24, 6);
    } else if (obs.kind === 'sandbag') {
      g.fillStyle(fill, 1);
      g.fillRoundedRect(x, y, w, h, 9);
      g.lineStyle(2, stroke, 1);
      g.strokeRoundedRect(x, y, w, h, 9);
      g.fillStyle(top, 0.9);
      const stepX = Math.min(20, w * 0.45);
      const stepY = Math.min(16, h * 0.45);
      for (let sy = y + 4; sy < y + h - 8; sy += stepY) {
        for (let sx = x + 4; sx < x + w - 8; sx += stepX) {
          g.fillRoundedRect(sx, sy, Math.min(stepX - 3, w - 8), Math.min(stepY - 3, h - 8), 4);
        }
      }
    } else if (obs.kind === 'bunker' || obs.kind === 'building') {
      g.fillStyle(fill, 1);
      g.fillRoundedRect(x, y, w, h, 4);
      g.lineStyle(3, stroke, 1);
      g.strokeRoundedRect(x, y, w, h, 4);
      g.fillStyle(top, 0.92);
      g.fillRoundedRect(x + 8, y + 8, w - 16, h - 16, 3);
      g.lineStyle(1.5, stroke, 0.55);
      g.strokeRoundedRect(x + 8, y + 8, w - 16, h - 16, 3);
      // Panel seams
      g.lineStyle(1.2, stroke, 0.35);
      g.lineBetween(x + w / 2, y + 10, x + w / 2, y + h - 10);
      g.lineBetween(x + 10, y + h / 2, x + w - 10, y + h / 2);
      g.fillStyle(stroke, 0.5);
      g.fillCircle(x + w / 2, y + h / 2, Math.min(w, h) * 0.12);
      g.fillStyle(0xfbbf24, 0.35);
      g.fillRect(x + 6, y + 6, Math.min(18, w * 0.2), 4);
    } else if (obs.kind === 'barrier') {
      g.fillStyle(fill, 1);
      g.fillRoundedRect(x, y, w, h, 3);
      g.lineStyle(2.5, stroke, 1);
      g.strokeRoundedRect(x, y, w, h, 3);
      g.fillStyle(0xf59e0b, 0.85);
      const stripe = Math.max(8, Math.min(w, h) * 0.22);
      for (let i = -h; i < w + h; i += stripe * 2) {
        g.fillTriangle(x + i, y, x + i + stripe, y, x + i + stripe - h, y + h);
        g.fillTriangle(x + i + stripe, y, x + i + stripe * 2, y, x + i + stripe * 2 - h, y + h);
      }
      g.lineStyle(2, stroke, 0.9);
      g.strokeRoundedRect(x, y, w, h, 3);
    } else if (obs.kind === 'ice_wall') {
      g.fillStyle(fill, 1);
      g.fillRoundedRect(x, y, w, h, 8);
      g.lineStyle(2.5, stroke, 1);
      g.strokeRoundedRect(x, y, w, h, 8);
      g.fillStyle(top, 0.85);
      g.fillRoundedRect(x + 7, y + 7, w - 14, h * 0.42, 5);
      g.lineStyle(2, 0xffffff, 0.45);
      g.lineBetween(x + 14, y + h - 14, x + w - 14, y + 14);
    } else if (obs.kind === 'wreck' || obs.kind === 'machinery') {
      g.fillStyle(fill, 1);
      g.fillRoundedRect(x, y, w, h, 5);
      g.lineStyle(2.5, stroke, 1);
      g.strokeRoundedRect(x, y, w, h, 5);
      g.fillStyle(top, 0.65);
      g.fillRoundedRect(x + 5, y + 5, w * 0.45, h * 0.4, 3);
      g.fillStyle(stroke, 0.4);
      g.fillCircle(x + w * 0.72, y + h * 0.55, Math.min(w, h) * 0.18);
      g.lineStyle(2, top, 0.5);
      g.lineBetween(x + 8, y + h - 10, x + w - 8, y + 12);
      if (obs.kind === 'machinery') {
        g.fillStyle(0x64748b, 0.7);
        g.fillRect(x + w * 0.15, y + 6, w * 0.7, 5);
      }
    } else if (obs.kind === 'ruin') {
      g.fillStyle(fill, 1);
      g.fillRoundedRect(x, y, w, h, 4);
      g.lineStyle(2.5, stroke, 1);
      g.strokeRoundedRect(x, y, w, h, 4);
      g.fillStyle(top, 0.8);
      g.fillRoundedRect(x + 5, y + 5, w - 10, Math.max(10, h * 0.35), 3);
      // Broken brick courses
      g.lineStyle(1.4, stroke, 0.45);
      for (let row = y + 14; row < y + h - 6; row += 12) {
        g.lineBetween(x + 6, row, x + w - 6, row);
      }
      g.fillStyle(stroke, 0.25);
      g.fillTriangle(x + w * 0.55, y, x + w, y, x + w, y + h * 0.35);
    } else {
      // Rock / default — faceted boulder silhouette clipped to AABB
      g.fillStyle(fill, 1);
      g.fillRoundedRect(x, y, w, h, 8);
      g.lineStyle(2.5, stroke, 1);
      g.strokeRoundedRect(x, y, w, h, 8);
      g.fillStyle(top, 0.7);
      g.fillTriangle(x + 6, y + h * 0.55, x + w * 0.45, y + 6, x + w * 0.7, y + h * 0.4);
      g.fillStyle(stroke, 0.25);
      g.fillTriangle(x + w * 0.4, y + h * 0.5, x + w - 6, y + 10, x + w - 8, y + h - 8);
      g.lineStyle(1.5, stroke, 0.4);
      g.lineBetween(x + 10, y + h * 0.62, x + w - 10, y + h * 0.7);
    }

    this.layer.add(g);
  }
}
