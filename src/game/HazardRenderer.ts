import Phaser from 'phaser';
import {
  generateMapHazards,
  getActiveBomb,
  getMapWindAt,
  getSurfaceAt,
  HAZARD_TUNING,
  isInGrass,
  mulberry32,
  hashString,
  type BombInfo,
  type WindState,
} from '../shared/hazards';
import type {
  ArenaMap,
  GameMode,
  HazardZone,
  SurfaceKind,
  TurretEntity,
} from '../shared/types';

interface WindStreak {
  x: number;
  y: number;
  len: number;
  speed: number;
  alpha: number;
}

interface TurretVisual {
  container: Phaser.GameObjects.Container;
  barrel: Phaser.GameObjects.Graphics;
  glow: Phaser.GameObjects.Arc;
  angle: number;
  team: 'red' | 'blue';
}

export interface EnvStatus {
  windActive: boolean;
  windWarning: boolean;
  windAngle: number;
  windStrength: number;
}

const TEX_PREFIX = 'hz_';

/**
 * Draws seeded beta-map hazards: baked floor patches (sand/ice/lava crust/grass), animated lava,
 * wind streaks, stun-bomb telegraphs and wall turrets. Gameplay state lives in shared/server code;
 * this class is purely visual (plus pure lookups like surfaceAt for local prediction).
 */
export class HazardRenderer {
  private zones: HazardZone[] = [];
  private map: ArenaMap | null = null;
  private seed = 0;
  private matchStartTime = 0;
  private mode: GameMode = 'deathmatch';
  private key = '';

  private floorImages: Phaser.GameObjects.Image[] = [];
  private grassImages: Phaser.GameObjects.Image[] = [];
  private textureKeys: string[] = [];
  private lavaGfx?: Phaser.GameObjects.Graphics;
  private windGfx?: Phaser.GameObjects.Graphics;
  private bombGfx?: Phaser.GameObjects.Graphics;
  private streaks: WindStreak[] = [];
  private turretVisuals = new Map<string, TurretVisual>();
  private bombExploded = new Set<string>();
  private lastWind: WindState = { active: false, warning: false, angle: 0, strength: 0 };

  onBombDetonated?: (x: number, y: number, radius: number) => void;

  constructor(private scene: Phaser.Scene) {}

  /** (Re)build visuals when the map or match seed changes. Returns true if rebuilt. */
  ensure(map: ArenaMap, seed: number, matchStartTime: number, mode: GameMode): boolean {
    this.matchStartTime = matchStartTime;
    this.mode = mode;
    const key = `${map.id}:${seed}`;
    if (key === this.key) return false;
    this.clear();
    this.key = key;
    this.map = map;
    this.seed = seed;

    const hazards = generateMapHazards(map, seed);
    this.zones = hazards.zones;
    this.bombExploded.clear();

    this.buildFloorZones(map);

    if (this.zones.some((z) => z.kind === 'lava')) {
      this.lavaGfx = this.scene.add.graphics().setDepth(1.4);
    }
    if (map.hazardSpec?.wind) {
      this.windGfx = this.scene.add.graphics().setDepth(19);
      this.streaks = [];
    }
    if (map.hazardSpec?.bombs) {
      this.bombGfx = this.scene.add.graphics().setDepth(11);
    }
    return true;
  }

  clear(): void {
    for (const img of this.floorImages) img.destroy();
    for (const img of this.grassImages) img.destroy();
    this.floorImages = [];
    this.grassImages = [];
    for (const k of this.textureKeys) {
      if (this.scene.textures.exists(k)) this.scene.textures.remove(k);
    }
    this.textureKeys = [];
    this.lavaGfx?.destroy();
    this.windGfx?.destroy();
    this.bombGfx?.destroy();
    this.lavaGfx = undefined;
    this.windGfx = undefined;
    this.bombGfx = undefined;
    for (const t of this.turretVisuals.values()) t.container.destroy();
    this.turretVisuals.clear();
    this.streaks = [];
    this.zones = [];
    this.map = null;
    this.key = '';
    this.lastWind = { active: false, warning: false, angle: 0, strength: 0 };
  }

  // ---- lookups used by gameplay prediction / concealment -------------------

  surfaceAt(x: number, y: number): SurfaceKind {
    return getSurfaceAt(this.zones, x, y);
  }

  inGrass(x: number, y: number): boolean {
    return isInGrass(this.zones, x, y);
  }

  hasGrass(): boolean {
    return this.zones.some((z) => z.kind === 'grass');
  }

  getStatus(): EnvStatus {
    return {
      windActive: this.lastWind.active,
      windWarning: this.lastWind.warning,
      windAngle: this.lastWind.angle,
      windStrength: this.lastWind.strength,
    };
  }

  // ---- per-frame ------------------------------------------------------------

  update(serverNowMs: number, dt: number, turrets: TurretEntity[], nowPerf: number): void {
    if (!this.map) return;
    const elapsed = serverNowMs - this.matchStartTime;

    this.drawLava(nowPerf);
    this.updateWind(elapsed, dt);
    this.updateBombs(elapsed, nowPerf);
    this.syncTurrets(turrets, dt, nowPerf);
  }

  // ---- floor zones ----------------------------------------------------------

  private buildFloorZones(map: ArenaMap): void {
    for (const zone of this.zones) {
      const pad = 24;
      const w = Math.ceil(zone.rx * 2 + pad * 2);
      const h = Math.ceil(zone.ry * 2 + pad * 2);
      const rand = mulberry32(hashString(`${map.id}:${this.seed}:${zone.id}`));

      const baseKey = `${TEX_PREFIX}${map.id}_${this.seed}_${zone.id}`;
      this.bakeTexture(baseKey, w, h, (ctx) => {
        ctx.translate(w / 2, h / 2);
        if (zone.kind === 'sand') this.paintSand(ctx, zone, rand);
        else if (zone.kind === 'ice') this.paintIce(ctx, zone, rand);
        else if (zone.kind === 'lava') this.paintLavaCrust(ctx, zone, rand);
        else this.paintGrassBase(ctx, zone);
      });
      const img = this.scene.add.image(zone.x, zone.y, baseKey).setDepth(1);
      this.floorImages.push(img);

      if (zone.kind === 'grass') {
        const topKey = `${baseKey}_top`;
        this.bakeTexture(topKey, w, h, (ctx) => {
          ctx.translate(w / 2, h / 2);
          this.paintGrassBlades(ctx, zone, rand);
        });
        this.grassImages.push(this.scene.add.image(zone.x, zone.y, topKey).setDepth(17));
      }
    }
  }

  private bakeTexture(
    key: string,
    w: number,
    h: number,
    draw: (ctx: CanvasRenderingContext2D) => void
  ): void {
    if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
    const tex = this.scene.textures.createCanvas(key, w, h);
    if (!tex) return;
    const ctx = tex.getContext();
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    draw(ctx);
    ctx.restore();
    tex.refresh();
    this.textureKeys.push(key);
  }

  private ellipsePath(ctx: CanvasRenderingContext2D, rx: number, ry: number, inset = 0): void {
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(1, rx - inset), Math.max(1, ry - inset), 0, 0, Math.PI * 2);
  }

  private softFill(
    ctx: CanvasRenderingContext2D,
    zone: HazardZone,
    inner: string,
    edge: string,
    solidStop = 0.65
  ): void {
    ctx.save();
    ctx.scale(1, zone.ry / zone.rx);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, zone.rx);
    grad.addColorStop(0, inner);
    grad.addColorStop(solidStop, inner);
    grad.addColorStop(1, edge);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, zone.rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private paintSand(ctx: CanvasRenderingContext2D, zone: HazardZone, rand: () => number): void {
    this.softFill(ctx, zone, 'rgba(240, 208, 130, 0.82)', 'rgba(240, 208, 130, 0)');
    ctx.save();
    this.ellipsePath(ctx, zone.rx, zone.ry, 6);
    ctx.clip();
    ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) {
      const y0 = (rand() * 2 - 1) * zone.ry * 0.85;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(180, 130, 60, 0.45)' : 'rgba(255, 238, 190, 0.5)';
      ctx.beginPath();
      for (let x = -zone.rx; x <= zone.rx; x += 10) {
        const y = y0 + Math.sin(x / 34 + i * 1.7) * 5;
        if (x === -zone.rx) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(150, 105, 50, 0.45)';
    for (let i = 0; i < 40; i++) {
      ctx.fillRect((rand() * 2 - 1) * zone.rx, (rand() * 2 - 1) * zone.ry, 2, 2);
    }
    ctx.restore();
  }

  private paintIce(ctx: CanvasRenderingContext2D, zone: HazardZone, rand: () => number): void {
    this.softFill(ctx, zone, 'rgba(206, 242, 255, 0.78)', 'rgba(206, 242, 255, 0)');
    ctx.save();
    this.ellipsePath(ctx, zone.rx, zone.ry, 6);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 8; i++) {
      let x = (rand() * 2 - 1) * zone.rx * 0.8;
      let y = (rand() * 2 - 1) * zone.ry * 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let s = 0; s < 4; s++) {
        x += (rand() - 0.5) * 70;
        y += (rand() - 0.5) * 50;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // Glints
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 12; i++) {
      const gx = (rand() * 2 - 1) * zone.rx * 0.8;
      const gy = (rand() * 2 - 1) * zone.ry * 0.8;
      ctx.beginPath();
      ctx.moveTo(gx - 5, gy);
      ctx.lineTo(gx, gy - 1.5);
      ctx.lineTo(gx + 5, gy);
      ctx.lineTo(gx, gy + 1.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(120, 190, 225, 0.55)';
    ctx.lineWidth = 2;
    this.ellipsePath(ctx, zone.rx, zone.ry, 3);
    ctx.stroke();
  }

  private paintLavaCrust(ctx: CanvasRenderingContext2D, zone: HazardZone, rand: () => number): void {
    // Dark scorched halo + glowing molten pool; animated overlay is drawn each frame.
    this.softFill(ctx, { ...zone, rx: zone.rx + 10, ry: zone.ry + 10 }, 'rgba(15, 4, 2, 0.75)', 'rgba(15, 4, 2, 0)', 0.7);
    ctx.save();
    this.ellipsePath(ctx, zone.rx, zone.ry, 0);
    ctx.clip();
    ctx.fillStyle = '#b53a0a';
    ctx.fillRect(-zone.rx, -zone.ry, zone.rx * 2, zone.ry * 2);
    ctx.fillStyle = 'rgba(255, 140, 40, 0.55)';
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.ellipse(
        (rand() * 2 - 1) * zone.rx * 0.8,
        (rand() * 2 - 1) * zone.ry * 0.8,
        10 + rand() * 20,
        6 + rand() * 12,
        rand() * Math.PI,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = '#2a0c05';
    ctx.lineWidth = 5;
    this.ellipsePath(ctx, zone.rx, zone.ry, 2);
    ctx.stroke();
  }

  private paintGrassBase(ctx: CanvasRenderingContext2D, zone: HazardZone): void {
    this.softFill(ctx, zone, 'rgba(20, 70, 28, 0.6)', 'rgba(20, 70, 28, 0)', 0.6);
  }

  private paintGrassBlades(ctx: CanvasRenderingContext2D, zone: HazardZone, rand: () => number): void {
    const area = Math.PI * zone.rx * zone.ry;
    const count = Math.min(1400, Math.round(area / 85));
    const greens = ['#3c8f3f', '#2f7a36', '#4aa24a', '#276b2d'];
    for (let i = 0; i < count; i++) {
      // rejection sample inside ellipse (soft edge)
      let x = 0;
      let y = 0;
      for (let tries = 0; tries < 6; tries++) {
        x = (rand() * 2 - 1) * zone.rx;
        y = (rand() * 2 - 1) * zone.ry;
        if ((x * x) / (zone.rx * zone.rx) + (y * y) / (zone.ry * zone.ry) <= 0.94) break;
      }
      const h = 12 + rand() * 12;
      const tilt = (rand() - 0.5) * 7;
      ctx.strokeStyle = greens[Math.floor(rand() * greens.length)];
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + tilt, y - h);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // ---- animated lava ----------------------------------------------------------

  private drawLava(nowPerf: number): void {
    const g = this.lavaGfx;
    if (!g) return;
    g.clear();
    const t = nowPerf / 1000;
    for (const z of this.zones) {
      if (z.kind !== 'lava') continue;
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.2 + z.x * 0.01);
      g.fillStyle(0xffa63a, 0.18 + pulse * 0.2);
      g.fillEllipse(z.x, z.y, z.rx * 1.7, z.ry * 1.7);
      // Drifting bright blobs
      for (let i = 0; i < 4; i++) {
        const a = t * (0.35 + i * 0.12) + i * 1.9 + z.y * 0.01;
        const bx = z.x + Math.cos(a) * z.rx * 0.5;
        const by = z.y + Math.sin(a * 1.3) * z.ry * 0.45;
        g.fillStyle(0xffd166, 0.25 + 0.2 * Math.sin(t * 3 + i));
        g.fillEllipse(bx, by, z.rx * 0.42, z.ry * 0.36);
      }
      g.lineStyle(3, 0xff7a1a, 0.5 + pulse * 0.4);
      g.strokeEllipse(z.x, z.y, z.rx * 2 - 6, z.ry * 2 - 6);
    }
  }

  // ---- wind -------------------------------------------------------------------

  private updateWind(elapsedMs: number, dt: number): void {
    const map = this.map;
    const g = this.windGfx;
    if (!map || !g) return;
    const wind = getMapWindAt(map, this.seed, elapsedMs);
    this.lastWind = wind;
    g.clear();
    if (!wind.active && !wind.warning) {
      this.streaks.length = 0;
      return;
    }

    const dirX = Math.cos(wind.angle);
    const dirY = Math.sin(wind.angle);
    const intensity = wind.active ? wind.strength : 0.25;
    const target = Math.round(14 + intensity * 40);

    while (this.streaks.length < target) {
      this.streaks.push(this.newStreak(map, dirX, dirY, true));
    }
    if (this.streaks.length > target) this.streaks.length = target;

    for (let i = 0; i < this.streaks.length; i++) {
      const s = this.streaks[i];
      const speed = s.speed * (0.4 + intensity);
      s.x += dirX * speed * dt;
      s.y += dirY * speed * dt;
      if (s.x < -200 || s.x > map.width + 200 || s.y < -200 || s.y > map.height + 200) {
        this.streaks[i] = this.newStreak(map, dirX, dirY, false);
        continue;
      }
      g.lineStyle(2, 0xffffff, s.alpha * (0.35 + intensity * 0.65));
      g.lineBetween(s.x, s.y, s.x - dirX * s.len, s.y - dirY * s.len);
    }
  }

  private newStreak(map: ArenaMap, dirX: number, dirY: number, anywhere: boolean): WindStreak {
    let x = Math.random() * map.width;
    let y = Math.random() * map.height;
    if (!anywhere) {
      // respawn on the upwind edge
      if (Math.abs(dirX) >= Math.abs(dirY)) {
        x = dirX > 0 ? -100 : map.width + 100;
      } else {
        y = dirY > 0 ? -100 : map.height + 100;
      }
    }
    return {
      x,
      y,
      len: 50 + Math.random() * 90,
      speed: 700 + Math.random() * 600,
      alpha: 0.35 + Math.random() * 0.4,
    };
  }

  // ---- stun bombs ---------------------------------------------------------------

  private updateBombs(elapsedMs: number, nowPerf: number): void {
    const map = this.map;
    const g = this.bombGfx;
    if (!map || !g) return;
    g.clear();
    const bomb: BombInfo | null = getActiveBomb(map, this.seed, elapsedMs);
    if (!bomb) return;

    const T = HAZARD_TUNING;
    if (elapsedMs < bomb.detonateAt) {
      const p = (elapsedMs - bomb.armAt) / T.bombTelegraphMs;
      const blink = 0.5 + 0.5 * Math.sin(nowPerf * (0.012 + p * 0.03));
      g.fillStyle(0xff3b30, 0.08 + p * 0.14);
      g.fillCircle(bomb.x, bomb.y, bomb.radius);
      g.lineStyle(3, 0xff5c4d, 0.35 + blink * 0.55);
      g.strokeCircle(bomb.x, bomb.y, bomb.radius);
      g.lineStyle(2, 0xffd166, 0.5 + blink * 0.4);
      g.strokeCircle(bomb.x, bomb.y, bomb.radius * Math.max(0.15, p));
      // Crosshair
      g.lineStyle(2, 0xffffff, 0.55);
      g.lineBetween(bomb.x - 14, bomb.y, bomb.x + 14, bomb.y);
      g.lineBetween(bomb.x, bomb.y - 14, bomb.x, bomb.y + 14);
      // Bomb body
      g.fillStyle(0x1f2937, 1);
      g.fillCircle(bomb.x, bomb.y, 9);
      g.fillStyle(blink > 0.5 ? 0xff3b30 : 0xfacc15, 1);
      g.fillCircle(bomb.x + 4, bomb.y - 7, 3);
    } else {
      if (!this.bombExploded.has(bomb.id)) {
        this.bombExploded.add(bomb.id);
        this.onBombDetonated?.(bomb.x, bomb.y, bomb.radius);
      }
      const p = Math.min(1, (elapsedMs - bomb.detonateAt) / 700);
      g.lineStyle(6 * (1 - p) + 1, 0xfff1a8, 1 - p);
      g.strokeCircle(bomb.x, bomb.y, bomb.radius * (0.4 + p * 0.7));
      g.fillStyle(0xfff7c2, 0.4 * (1 - p));
      g.fillCircle(bomb.x, bomb.y, bomb.radius * (0.3 + p * 0.5));
    }
  }

  // ---- turrets ------------------------------------------------------------------

  private syncTurrets(turrets: TurretEntity[], dt: number, nowPerf: number): void {
    const seen = new Set<string>();
    for (const t of turrets) {
      seen.add(t.id);
      let vis = this.turretVisuals.get(t.id);
      if (!vis) {
        vis = this.createTurret(t);
        this.turretVisuals.set(t.id, vis);
      }
      const diff = Phaser.Math.Angle.Wrap(t.angle - vis.angle);
      vis.angle = Phaser.Math.Angle.Wrap(vis.angle + diff * Math.min(1, dt * 14));
      vis.barrel.setRotation(vis.angle);
      const charge = Math.max(0, Math.min(1, t.charge));
      vis.glow.setAlpha(0.15 + charge * 0.75 * (0.7 + 0.3 * Math.sin(nowPerf * 0.02)));
      vis.glow.setPosition(Math.cos(vis.angle) * 22, Math.sin(vis.angle) * 22);
    }
    for (const [id, vis] of this.turretVisuals.entries()) {
      if (!seen.has(id)) {
        vis.container.destroy();
        this.turretVisuals.delete(id);
      }
    }
  }

  private createTurret(t: TurretEntity): TurretVisual {
    const ctfColor = t.team === 'red' ? 0xef4444 : 0x3b82f6;
    const color = this.mode === 'ctf' ? ctfColor : 0xf59e0b;

    const base = this.scene.add.graphics();
    base.fillStyle(0x000000, 0.35);
    base.fillCircle(3, 4, 21);
    base.fillStyle(0x1f2937, 1);
    base.fillCircle(0, 0, 20);
    base.lineStyle(3, color, 0.95);
    base.strokeCircle(0, 0, 20);
    base.fillStyle(0x374151, 1);
    base.fillCircle(0, 0, 12);
    base.lineStyle(1.5, 0x9ca3af, 0.8);
    base.strokeCircle(0, 0, 12);

    const barrel = this.scene.add.graphics();
    barrel.fillStyle(0x111827, 1);
    barrel.fillRoundedRect(0, -5, 28, 10, 3);
    barrel.lineStyle(2, color, 0.95);
    barrel.strokeRoundedRect(0, -5, 28, 10, 3);
    barrel.fillStyle(color, 1);
    barrel.fillRect(24, -3.5, 4, 7);

    const glow = this.scene.add.circle(0, 0, 7, color, 0.5);
    glow.setBlendMode(Phaser.BlendModes.ADD);

    const container = this.scene.add.container(t.x, t.y, [base, barrel, glow]).setDepth(13);
    return { container, barrel, glow, angle: t.angle, team: t.team };
  }
}
