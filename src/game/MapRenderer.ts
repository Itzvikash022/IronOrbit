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

    // 1. Tiled Biome Floor
    const tile = this.scene.add.tileSprite(
      map.width / 2,
      map.height / 2,
      map.width,
      map.height,
      `tile_${map.id}`
    );
    this.layer.add(tile);

    // 2. Arena Boundary Frame & Subtle Grid
    const g = this.scene.add.graphics();
    g.lineStyle(1, 0xffffff, 0.045);
    for (let x = 150; x < map.width; x += 150) {
      g.lineBetween(x, 0, x, map.height);
    }
    for (let y = 150; y < map.height; y += 150) {
      g.lineBetween(0, y, map.width, y);
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

    // 4. Stylized Biome Obstacles with Contact Shadows & Surface Details
    for (const obs of map.obstacles) {
      this.drawObstacle(obs, map);
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

    // Contact drop shadow
    g.fillStyle(0x000000, 0.35);
    g.fillRoundedRect(obs.x + 6, obs.y + 8, obs.w, obs.h, 6);

    if (obs.kind === 'tree') {
      const cx = obs.x + obs.w / 2;
      const cy = obs.y + obs.h / 2;
      const r = Math.min(obs.w, obs.h) * 0.48;
      // Trunk base
      g.fillStyle(fill, 1);
      g.fillCircle(cx, cy, r * 0.42);
      // Foliage crown
      g.fillStyle(top, 1);
      g.fillCircle(cx, cy, r);
      g.lineStyle(2.5, stroke, 1);
      g.strokeCircle(cx, cy, r);
      g.fillStyle(0x40916c, 0.75);
      g.fillCircle(cx - r * 0.18, cy - r * 0.18, r * 0.62);
    } else if (obs.kind === 'container') {
      g.fillStyle(fill, 1);
      g.fillRoundedRect(obs.x, obs.y, obs.w, obs.h, 4);
      g.lineStyle(2.5, stroke, 1);
      g.strokeRoundedRect(obs.x, obs.y, obs.w, obs.h, 4);
      // Corrugated ribs
      g.lineStyle(2, top, 0.75);
      if (obs.w >= obs.h) {
        for (let rx = obs.x + 14; rx < obs.x + obs.w - 8; rx += 14) {
          g.lineBetween(rx, obs.y + 5, rx, obs.y + obs.h - 5);
        }
      } else {
        for (let ry = obs.y + 14; ry < obs.y + obs.h - 8; ry += 14) {
          g.lineBetween(obs.x + 5, ry, obs.x + obs.w - 5, ry);
        }
      }
    } else if (obs.kind === 'lava_pillar') {
      g.fillStyle(fill, 1);
      g.fillRoundedRect(obs.x, obs.y, obs.w, obs.h, 12);
      g.lineStyle(3, 0xf97316, 0.85);
      g.strokeRoundedRect(obs.x, obs.y, obs.w, obs.h, 12);
      g.fillStyle(0xea580c, 0.45);
      g.fillRoundedRect(obs.x + 12, obs.y + 12, obs.w - 24, obs.h - 24, 6);
    } else if (obs.kind === 'sandbag') {
      g.fillStyle(fill, 1);
      g.fillRoundedRect(obs.x, obs.y, obs.w, obs.h, 10);
      g.lineStyle(2, stroke, 1);
      g.strokeRoundedRect(obs.x, obs.y, obs.w, obs.h, 10);
      g.fillStyle(top, 0.85);
      const step = 22;
      for (let sy = obs.y + 6; sy < obs.y + obs.h - 10; sy += step) {
        for (let sx = obs.x + 6; sx < obs.x + obs.w - 10; sx += step) {
          g.fillRoundedRect(sx, sy, Math.min(18, obs.w - 12), Math.min(16, obs.h - 12), 5);
        }
      }
    } else if (obs.kind === 'bunker' || obs.kind === 'building') {
      g.fillStyle(fill, 1);
      g.fillRoundedRect(obs.x, obs.y, obs.w, obs.h, 5);
      g.lineStyle(3, stroke, 1);
      g.strokeRoundedRect(obs.x, obs.y, obs.w, obs.h, 5);
      // Inner rooftop bevel
      g.fillStyle(top, 0.9);
      g.fillRoundedRect(obs.x + 10, obs.y + 10, obs.w - 20, obs.h - 20, 3);
      g.lineStyle(1.5, stroke, 0.6);
      g.strokeRoundedRect(obs.x + 10, obs.y + 10, obs.w - 20, obs.h - 20, 3);
      // Center vent / hatch detail
      g.fillStyle(stroke, 0.45);
      g.fillCircle(obs.x + obs.w / 2, obs.y + obs.h / 2, Math.min(obs.w, obs.h) * 0.14);
    } else if (obs.kind === 'ice_wall') {
      g.fillStyle(fill, 1);
      g.fillRoundedRect(obs.x, obs.y, obs.w, obs.h, 8);
      g.lineStyle(2.5, stroke, 1);
      g.strokeRoundedRect(obs.x, obs.y, obs.w, obs.h, 8);
      g.fillStyle(top, 0.85);
      g.fillRoundedRect(obs.x + 7, obs.y + 7, obs.w - 14, obs.h * 0.42, 5);
      // Crystalline diagonal sheen
      g.lineStyle(2, 0xffffff, 0.45);
      g.lineBetween(obs.x + 14, obs.y + obs.h - 14, obs.x + obs.w - 14, obs.y + 14);
    } else {
      // Rock, ruin, wreck, machinery, barrier
      g.fillStyle(fill, 1);
      g.fillRoundedRect(obs.x, obs.y, obs.w, obs.h, 7);
      g.lineStyle(2.5, stroke, 1);
      g.strokeRoundedRect(obs.x, obs.y, obs.w, obs.h, 7);
      g.fillStyle(top, 0.72);
      g.fillRoundedRect(obs.x + 6, obs.y + 6, obs.w - 12, Math.max(8, obs.h * 0.38), 4);
      g.lineStyle(1.5, stroke, 0.35);
      g.lineBetween(obs.x + 10, obs.y + obs.h * 0.65, obs.x + obs.w - 10, obs.y + obs.h * 0.65);
    }

    this.layer.add(g);
  }
}
