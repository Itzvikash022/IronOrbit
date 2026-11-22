import Phaser from 'phaser';
import { DEFAULT_ACTION_BIND } from '../shared/actionBind';
import { DEFAULT_GAME_SETTINGS, POWERUP_META } from '../shared/config';
import { ARENA_MAPS } from '../shared/maps';
import {
  computeArenaCameraZoom,
  getShootSettleMs,
  normalizeAngle,
  registerFireClick,
  RotationFlipState,
  stepRotationFlip,
  stepTankMotion,
} from '../shared/physics';
import {
  ActionBind,
  FlagEntity,
  GameMode,
  GameSettings,
  GraphicsQuality,
  MapId,
  MatchSnapshot,
  PlayerInputState,
  ProjectileEntity,
  SupplyCrateEntity,
  TankEntity,
} from '../shared/types';
import { MapRenderer } from './MapRenderer';
import { ParticlePool } from './ObjectPool';
import { TankSprite } from './TankSprite';
import { generateGameTextures } from './TextureGenerator';

interface RemoteInterpState {
  prevX: number;
  prevY: number;
  prevAngle: number;
  prevAim: number;
  targetX: number;
  targetY: number;
  targetAngle: number;
  targetAim: number;
  lastUpdateMs: number;
  sprite: TankSprite;
}

interface CrateVisual {
  container: Phaser.GameObjects.Container;
  halo: Phaser.GameObjects.Arc;
  base: Phaser.GameObjects.Image;
  icon: Phaser.GameObjects.Image;
}

interface ClientProjectileVisual {
  sprite: Phaser.GameObjects.Image;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface ArenaSceneBridge {
  onSendInput: (input: PlayerInputState) => void;
  onSendShoot: (aimAngle: number) => void;
  onSendFlip: () => void;
}

export class ArenaScene extends Phaser.Scene {
  private mapRenderer!: MapRenderer;
  private particles!: ParticlePool;

  private sceneMode: 'attract' | 'active' = 'attract';
  private activeMapId: MapId = 'industrial';
  private activeGameMode: GameMode = 'deathmatch';
  private settings: GameSettings = { ...DEFAULT_GAME_SETTINGS };
  private graphicsQuality: GraphicsQuality = 'high';
  private localPlayerId = '';
  private bridge: ArenaSceneBridge | null = null;
  private inputEnabled = false;
  private attractPaused = false;

  // Attract mode props
  private attractTime = 0;
  private attractPropA?: Phaser.GameObjects.Container;
  private attractPropB?: Phaser.GameObjects.Container;

  // Active match state
  private latestSnapshot: MatchSnapshot | null = null;
  private localPredTank: TankEntity | null = null;
  private tankVisuals = new Map<string, RemoteInterpState>();
  private crateVisuals = new Map<string, CrateVisual>();
  private projectileVisuals = new Map<string, ClientProjectileVisual>();
  private redFlagSprite?: Phaser.GameObjects.Image;
  private blueFlagSprite?: Phaser.GameObjects.Image;
  private muzzleFlash?: Phaser.GameObjects.Image;

  // Input state — one rebindable action: hold = drive + auto-fire, release = flip spin
  private actionBind: ActionBind = { ...DEFAULT_ACTION_BIND };
  private actionHeld = false;
  private inputSeq = 0;
  private lastSentInputAt = 0;
  private lastSentThrust = false;
  private lastAutoFireAt = 0;
  private localFlipState: RotationFlipState = { pendingClicks: 0, lastClickAt: 0 };
  private lastLocalFlipResolvedAt = 0;

  // Juice / camera
  private hitstopTimer = 0;
  private shakeTrauma = 0;
  private camFollowX = 1440;
  private camFollowY = 720;
  private serverTimeOffset = 0;
  private ambientAccumulator = 0;

  constructor() {
    super({ key: 'ArenaScene' });
  }

  setBridge(bridge: ArenaSceneBridge): void {
    this.bridge = bridge;
  }

  setGraphicsQuality(quality: GraphicsQuality): void {
    this.graphicsQuality = quality;
  }

  setInputEnabled(enabled: boolean): void {
    this.inputEnabled = enabled;
    if (!enabled) {
      this.releaseAction(false);
    }
  }

  setActionBind(bind: ActionBind): void {
    this.actionBind = bind;
    this.releaseAction(false);
  }

  setAttractPaused(paused: boolean): void {
    this.attractPaused = paused;
  }

  create(): void {
    generateGameTextures(this);
    this.mapRenderer = new MapRenderer(this);
    this.particles = new ParticlePool(this, 200);

    this.redFlagSprite = this.add.image(-999, -999, 'flag_red').setDepth(14).setVisible(false);
    this.blueFlagSprite = this.add.image(-999, -999, 'flag_blue').setDepth(14).setVisible(false);
    this.muzzleFlash = this.add.image(-999, -999, 'muzzle_flash').setDepth(24).setVisible(false);

    this.setupInputs();
    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.scale.off('resize', this.handleResize, this);
    });
    this.enterAttractMode(this.activeMapId);
  }

  private handleResize(): void {
    const map = ARENA_MAPS[this.activeMapId];
    this.applyCameraZoom(map.width, map.height);
  }

  private applyCameraZoom(mapWidth: number, mapHeight: number): void {
    const zoom = computeArenaCameraZoom(
      this.scale.width,
      this.scale.height,
      mapWidth,
      mapHeight
    );
    this.cameras.main.setZoom(zoom);
  }

  private setupInputs(): void {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!this.inputEnabled || this.sceneMode !== 'active') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (this.actionBind.device !== 'keyboard') return;
      if (e.code !== this.actionBind.code) return;
      if (e.repeat) return;
      e.preventDefault();
      this.pressAction();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (this.actionBind.device !== 'keyboard') return;
      if (e.code !== this.actionBind.code) return;
      this.releaseAction(true);
    };
    const onMouseDown = (e: MouseEvent) => {
      if (!this.inputEnabled || this.sceneMode !== 'active') return;
      if (this.actionBind.device !== 'mouse') return;
      if (e.button !== this.actionBind.button) return;
      e.preventDefault();
      this.pressAction();
    };
    const onMouseUp = (e: MouseEvent) => {
      if (this.actionBind.device !== 'mouse') return;
      if (e.button !== this.actionBind.button) return;
      this.releaseAction(true);
    };
    const onContextMenu = (e: MouseEvent) => {
      if (this.actionBind.device === 'mouse' && this.actionBind.button === 2) {
        e.preventDefault();
      }
    };
    const clearKeys = () => {
      this.releaseAction(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('blur', clearKeys);
    document.addEventListener('visibilitychange', clearKeys);

    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('blur', clearKeys);
      document.removeEventListener('visibilitychange', clearKeys);
    });
  }

  private pressAction(): void {
    if (this.actionHeld) return;
    this.actionHeld = true;
    this.fireForward();
    this.lastAutoFireAt = performance.now();
  }

  private releaseAction(flip: boolean): void {
    if (!this.actionHeld) return;
    this.actionHeld = false;
    if (!flip || !this.inputEnabled || this.sceneMode !== 'active') return;
    if (!this.localPredTank?.alive) return;
    const now = performance.now();
    registerFireClick(this.localFlipState, now);
    // Apply on the next sim step so spin reverses as soon as drive ends
    this.localFlipState.lastClickAt = now - getShootSettleMs(this.settings);
    this.bridge?.onSendFlip();
  }

  private fireForward(): void {
    if (!this.localPredTank || !this.localPredTank.alive) return;
    this.bridge?.onSendShoot(this.localPredTank.angle);
  }

  enterAttractMode(mapId: MapId = 'industrial'): void {
    this.sceneMode = 'attract';
    this.inputEnabled = false;
    this.clearActiveEntities();

    this.activeMapId = mapId;
    const map = ARENA_MAPS[mapId];
    this.mapRenderer.render(map, 'ctf');
    this.cameras.main.setBounds(-4000, -4000, map.width + 8000, map.height + 8000);
    this.applyCameraZoom(map.width, map.height);
    this.redFlagSprite?.setVisible(true).setPosition(map.redBase.x, map.redBase.y);
    this.blueFlagSprite?.setVisible(true).setPosition(map.blueBase.x, map.blueBase.y);

    // Decorative patrolling diorama tanks on title screen
    this.attractPropA?.destroy();
    this.attractPropB?.destroy();
    this.attractPropA = this.add
      .container(520, 600, [
        this.add.image(0, 0, 'tank_hull_red'),
        this.add.image(0, 0, 'tank_turret_red').setOrigin(0.5, 0.5),
      ])
      .setDepth(15);
    this.attractPropB = this.add
      .container(1280, 600, [
        this.add.image(0, 0, 'tank_hull_blue'),
        this.add.image(0, 0, 'tank_turret_blue').setOrigin(0.5, 0.5),
      ])
      .setDepth(15);
  }

  startActiveMatch(
    mapId: MapId,
    mode: GameMode,
    localPlayerId: string,
    settings: GameSettings,
    initialSnapshot?: MatchSnapshot
  ): void {
    this.sceneMode = 'active';
    this.activeMapId = mapId;
    this.activeGameMode = mode;
    this.localPlayerId = localPlayerId;
    this.settings = { ...settings };
    this.inputEnabled = true;

    this.attractPropA?.destroy();
    this.attractPropB?.destroy();
    this.attractPropA = undefined;
    this.attractPropB = undefined;

    this.clearActiveEntities();

    const map = ARENA_MAPS[mapId];
    this.mapRenderer.render(map, mode);
    this.cameras.main.setBounds(-4000, -4000, map.width + 8000, map.height + 8000);
    this.applyCameraZoom(map.width, map.height);

    this.camFollowX = map.width * 0.5;
    this.camFollowY = map.height * 0.5;
    this.cameras.main.centerOn(this.camFollowX, this.camFollowY);

    if (initialSnapshot) {
      this.applySnapshot(initialSnapshot);
    }
  }

  updateSettings(settings: GameSettings): void {
    this.settings = { ...settings };
  }

  resyncSnapshot(snapshot: MatchSnapshot): void {
    if (this.sceneMode !== 'active') return;
    this.actionHeld = false;
    this.lastAutoFireAt = 0;
    this.lastSentThrust = false;
    this.localFlipState = { pendingClicks: 0, lastClickAt: 0 };
    this.localPredTank = null;
    this.applySnapshot(snapshot, true);
    const map = ARENA_MAPS[this.activeMapId];
    this.camFollowX = map.width * 0.5;
    this.camFollowY = map.height * 0.5;
    this.cameras.main.centerOn(this.camFollowX, this.camFollowY);
  }

  applySnapshot(snapshot: MatchSnapshot, hardSnap = false): void {
    if (this.sceneMode !== 'active') return;
    this.latestSnapshot = snapshot;
    this.serverTimeOffset = snapshot.serverTime - performance.now();

    if (snapshot.mapId !== this.activeMapId || snapshot.mode !== this.activeGameMode) {
      this.activeMapId = snapshot.mapId;
      this.activeGameMode = snapshot.mode;
      const map = ARENA_MAPS[snapshot.mapId];
      this.mapRenderer.render(map, snapshot.mode);
      this.cameras.main.setBounds(-4000, -4000, map.width + 8000, map.height + 8000);
      this.applyCameraZoom(map.width, map.height);
    }

    const nowPerf = performance.now();
    const activeIds = new Set<string>();

    for (const srvTank of snapshot.tanks) {
      activeIds.add(srvTank.id);
      const isLocal = srvTank.id === this.localPlayerId;

      if (isLocal) {
        if (!this.localPredTank) {
          this.localPredTank = { ...srvTank, activePowerUps: [...srvTank.activePowerUps] };
        } else {
          const wasDead = !this.localPredTank.alive;
          const dist = Math.hypot(srvTank.x - this.localPredTank.x, srvTank.y - this.localPredTank.y);
          if (hardSnap || (wasDead && srvTank.alive) || dist > 110) {
            this.localPredTank.x = srvTank.x;
            this.localPredTank.y = srvTank.y;
            this.localPredTank.vx = srvTank.vx;
            this.localPredTank.vy = srvTank.vy;
            this.localPredTank.angle = srvTank.angle;
          } else {
            // Smooth authoritative reconciliation
            this.localPredTank.x += (srvTank.x - this.localPredTank.x) * 0.3;
            this.localPredTank.y += (srvTank.y - this.localPredTank.y) * 0.3;
            const angleDiff = normalizeAngle(srvTank.angle - this.localPredTank.angle);
            this.localPredTank.angle = normalizeAngle(this.localPredTank.angle + angleDiff * 0.32);
            if (!this.actionHeld) {
              this.localPredTank.vx = srvTank.vx;
              this.localPredTank.vy = srvTank.vy;
            }
          }

          if (
            hardSnap ||
            (this.localFlipState.pendingClicks === 0 &&
              nowPerf - this.lastLocalFlipResolvedAt > 600)
          ) {
            this.localPredTank.rotationDir = srvTank.rotationDir;
          }

          this.localPredTank.alive = srvTank.alive;
          this.localPredTank.hp = srvTank.hp;
          this.localPredTank.maxHp = srvTank.maxHp;
          this.localPredTank.ammo = srvTank.ammo;
          this.localPredTank.maxAmmo = srvTank.maxAmmo;
          this.localPredTank.ammoRegenProgress = srvTank.ammoRegenProgress;
          this.localPredTank.invincibleUntil = srvTank.invincibleUntil;
          this.localPredTank.activePowerUps = srvTank.activePowerUps;
          this.localPredTank.carryingFlag = srvTank.carryingFlag;
          this.localPredTank.team = srvTank.team;
          this.localPredTank.skinIndex = srvTank.skinIndex;
          this.localPredTank.kills = srvTank.kills;
          this.localPredTank.deaths = srvTank.deaths;
          this.localPredTank.score = srvTank.score;
          this.localPredTank.connected = srvTank.connected;
        }
      }

      let entry = this.tankVisuals.get(srvTank.id);
      if (!entry) {
        entry = {
          prevX: srvTank.x,
          prevY: srvTank.y,
          prevAngle: srvTank.angle,
          prevAim: srvTank.aimAngle,
          targetX: srvTank.x,
          targetY: srvTank.y,
          targetAngle: srvTank.angle,
          targetAim: srvTank.aimAngle,
          lastUpdateMs: nowPerf,
          sprite: new TankSprite(this, srvTank, isLocal),
        };
        this.tankVisuals.set(srvTank.id, entry);
      } else {
        const jumpDist = Math.hypot(srvTank.x - entry.targetX, srvTank.y - entry.targetY);
        if (hardSnap || jumpDist > 140) {
          entry.prevX = srvTank.x;
          entry.prevY = srvTank.y;
          entry.prevAngle = srvTank.angle;
          entry.prevAim = srvTank.aimAngle;
        } else {
          entry.prevX = entry.targetX;
          entry.prevY = entry.targetY;
          entry.prevAngle = entry.targetAngle;
          entry.prevAim = entry.targetAim;
        }
        entry.targetX = srvTank.x;
        entry.targetY = srvTank.y;
        entry.targetAngle = srvTank.angle;
        entry.targetAim = srvTank.aimAngle;
        entry.lastUpdateMs = nowPerf;
      }
    }

    // Remove disconnected/left tanks
    for (const [id, entry] of this.tankVisuals.entries()) {
      if (!activeIds.has(id)) {
        entry.sprite.destroy();
        this.tankVisuals.delete(id);
      }
    }

    // Sync projectiles
    const activeProjIds = new Set<string>();
    for (const p of snapshot.projectiles) {
      activeProjIds.add(p.id);
      let vis = this.projectileVisuals.get(p.id);
      if (!vis) {
        const sprite = this.add
          .image(p.x, p.y, p.isDoubleDamage ? 'proj_double' : 'proj_normal')
          .setDepth(20)
          .setScale(1.15)
          .setRotation(Math.atan2(p.vy, p.vx));
        vis = { sprite, x: p.x, y: p.y, vx: p.vx, vy: p.vy };
        this.projectileVisuals.set(p.id, vis);
      } else {
        vis.x = p.x;
        vis.y = p.y;
        vis.vx = p.vx;
        vis.vy = p.vy;
        vis.sprite.setPosition(p.x, p.y);
      }
    }
    for (const [id, vis] of this.projectileVisuals.entries()) {
      if (!activeProjIds.has(id)) {
        vis.sprite.destroy();
        this.projectileVisuals.delete(id);
      }
    }

    // Sync supply crates
    const activeCrateIds = new Set<string>();
    for (const c of snapshot.crates) {
      activeCrateIds.add(c.id);
      if (!this.crateVisuals.has(c.id)) {
        this.createCrateVisual(c);
      }
    }
    for (const [id, vis] of this.crateVisuals.entries()) {
      if (!activeCrateIds.has(id)) {
        vis.container.destroy();
        this.crateVisuals.delete(id);
      }
    }

    // Sync CTF flags
    this.syncFlagSprite(this.redFlagSprite, snapshot.flags.red, snapshot.mode === 'ctf');
    this.syncFlagSprite(this.blueFlagSprite, snapshot.flags.blue, snapshot.mode === 'ctf');
  }

  private syncFlagSprite(
    sprite: Phaser.GameObjects.Image | undefined,
    flag: FlagEntity,
    isCtf: boolean
  ): void {
    if (!sprite) return;
    if (!isCtf || flag.state === 'carried') {
      sprite.setVisible(false);
      return;
    }
    sprite.setVisible(true);
    sprite.setPosition(flag.x, flag.y);
  }

  private createCrateVisual(c: SupplyCrateEntity): void {
    const meta = POWERUP_META[c.powerUp];
    const colorNum = Phaser.Display.Color.HexStringToColor(meta.color).color;
    const halo = this.add.circle(0, 0, 22, colorNum, 0.22);
    halo.setStrokeStyle(2, colorNum, 0.85);
    const base = this.add.image(0, 0, 'crate_base');
    const icon = this.add.image(0, 0, `icon_${c.powerUp}`);
    const container = this.add.container(c.x, c.y, [halo, base, icon]).setDepth(12);
    this.crateVisuals.set(c.id, { container, halo, base, icon });
  }

  onShotFired(proj: ProjectileEntity, shooterId: string, aimAngle: number): void {
    if (this.sceneMode !== 'active') return;
    const entry = this.tankVisuals.get(shooterId);
    entry?.sprite.triggerRecoil();

    // Muzzle flash + directional sparks
    if (this.muzzleFlash) {
      this.muzzleFlash
        .setPosition(proj.x, proj.y)
        .setRotation(aimAngle)
        .setVisible(true)
        .setAlpha(1);
      this.tweens.add({
        targets: this.muzzleFlash,
        alpha: 0,
        duration: 75,
        onComplete: () => this.muzzleFlash?.setVisible(false),
      });
    }
    this.particles.emitDirectional(proj.x, proj.y, aimAngle, 0.55, 5, 0xfbbf24);
  }

  onProjectileImpact(x: number, y: number, hitTankId: string | null, blocked: boolean): void {
    if (this.sceneMode !== 'active') return;
    if (hitTankId) {
      const entry = this.tankVisuals.get(hitTankId);
      if (!blocked) entry?.sprite.triggerHitFlash();
      this.particles.emitBurst(x, y, blocked ? 8 : 12, {
        tint: blocked ? 0x22d3ee : 0xf97316,
        minSpeed: 60,
        maxSpeed: 190,
        life: 0.28,
        startScale: 0.9,
      });
      if (hitTankId === this.localPlayerId && !blocked) {
        this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.35);
      }
    } else {
      this.particles.emitBurst(x, y, 7, {
        tint: 0xfde047,
        minSpeed: 40,
        maxSpeed: 140,
        life: 0.22,
        startScale: 0.7,
      });
    }
  }

  onTankKilled(x: number, y: number, killerId: string, victimId: string): void {
    if (this.sceneMode !== 'active') return;
    this.particles.emitBurst(x, y, 22, {
      texture: 'particle_spark',
      tint: 0xf97316,
      minSpeed: 70,
      maxSpeed: 310,
      life: 0.52,
      startScale: 1.4,
    });
    this.particles.emitBurst(x, y, 10, {
      texture: 'particle_smoke',
      minSpeed: 20,
      maxSpeed: 110,
      life: 0.75,
      startScale: 1.3,
      depth: 23,
    });

    if (killerId === this.localPlayerId || victimId === this.localPlayerId) {
      this.hitstopTimer = 0.045;
      this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.75);
    }
  }

  onCrateSpawned(crate: SupplyCrateEntity): void {
    if (this.sceneMode !== 'active') return;
    const meta = POWERUP_META[crate.powerUp];
    const colorNum = Phaser.Display.Color.HexStringToColor(meta.color).color;
    const ring = this.add.circle(crate.x, crate.y, 12, colorNum, 0).setDepth(13);
    ring.setStrokeStyle(3, colorNum, 0.9);
    this.tweens.add({
      targets: ring,
      radius: 58,
      alpha: 0,
      duration: 650,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy(),
    });
  }

  onCrateCollected(x: number, y: number, powerUpType: string): void {
    if (this.sceneMode !== 'active') return;
    const meta = POWERUP_META[powerUpType as keyof typeof POWERUP_META];
    const colorNum = meta
      ? Phaser.Display.Color.HexStringToColor(meta.color).color
      : 0xfbbf24;
    this.particles.emitBurst(x, y, 14, {
      tint: colorNum,
      minSpeed: 50,
      maxSpeed: 180,
      life: 0.36,
      startScale: 1.0,
    });
  }

  update(_time: number, rawDeltaMs: number): void {
    const rawDt = Math.min(rawDeltaMs / 1000, 0.05);

    if (this.sceneMode === 'attract') {
      if (!this.attractPaused) {
        this.updateAttract(rawDt);
        this.particles.update(rawDt);
      }
      return;
    }

    // Hitstop pauses gameplay visual motion briefly while camera shake & particles run
    let simDt = rawDt;
    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - rawDt);
      simDt = 0;
    }

    const nowPerf = performance.now();
    const serverNow = nowPerf + this.serverTimeOffset;
    const map = ARENA_MAPS[this.activeMapId];

    // 1. Update local predicted tank + send inputs at ~25Hz or on state edge
    if (this.localPredTank) {
      if (
        stepRotationFlip(
          this.localPredTank,
          this.localFlipState,
          nowPerf,
          this.settings
        )
      ) {
        this.lastLocalFlipResolvedAt = nowPerf;
      }

      if (simDt > 0) {
        stepTankMotion(
          this.localPredTank,
          this.actionHeld && this.inputEnabled,
          simDt,
          map,
          this.settings,
          serverNow
        );
      }

      // Hold = keep topping up fire requests; server cooldown gates real shots
      if (this.actionHeld && this.inputEnabled && this.localPredTank.alive) {
        const fireGap = Math.max(40, this.settings.fireCooldownMs * 0.45);
        if (nowPerf - this.lastAutoFireAt >= fireGap) {
          this.lastAutoFireAt = nowPerf;
          this.fireForward();
        }
      }

      if (
        this.inputEnabled &&
        (this.actionHeld !== this.lastSentThrust || nowPerf - this.lastSentInputAt >= 40)
      ) {
        this.lastSentThrust = this.actionHeld;
        this.lastSentInputAt = nowPerf;
        this.bridge?.onSendInput({
          seq: ++this.inputSeq,
          thrust: this.actionHeld,
          aimAngle: this.localPredTank.angle,
        });
      }
    }

    // 2. Render all tank sprites (local predicted, remote interpolated)
    if (this.latestSnapshot) {
      const tickIntervalMs = 1000 / Math.max(10, this.settings.serverTickRate);
      for (const srvTank of this.latestSnapshot.tanks) {
        const entry = this.tankVisuals.get(srvTank.id);
        if (!entry) continue;

        if (srvTank.id === this.localPlayerId && this.localPredTank) {
          entry.sprite.update(
            this.localPredTank.x,
            this.localPredTank.y,
            this.localPredTank.angle,
            this.localPredTank.angle,
            this.localPredTank,
            serverNow,
            rawDt
          );
        } else {
          const alpha = Math.min(1, (nowPerf - entry.lastUpdateMs) / tickIntervalMs);
          const ix = Phaser.Math.Linear(entry.prevX, entry.targetX, alpha);
          const iy = Phaser.Math.Linear(entry.prevY, entry.targetY, alpha);
          const angDiff = normalizeAngle(entry.targetAngle - entry.prevAngle);
          const ia = normalizeAngle(entry.prevAngle + angDiff * alpha);
          entry.sprite.update(ix, iy, ia, ia, srvTank, serverNow, rawDt);
        }
      }
    }

    // 3. Extrapolate projectiles smoothly between snapshots
    if (simDt > 0) {
      for (const vis of this.projectileVisuals.values()) {
        vis.x += vis.vx * simDt;
        vis.y += vis.vy * simDt;
        vis.sprite.setPosition(vis.x, vis.y);
      }
    }

    // 4. Animate supply crates
    for (const vis of this.crateVisuals.values()) {
      const pulse = 1 + Math.sin(nowPerf * 0.006) * 0.14;
      vis.halo.setScale(pulse);
      vis.icon.setY(Math.sin(nowPerf * 0.004) * 2.5);
    }

    // 5. Full-map camera centered on arena + light trauma shake
    {
      this.camFollowX = map.width * 0.5;
      this.camFollowY = map.height * 0.5;

      let shakeX = 0;
      let shakeY = 0;
      if (this.shakeTrauma > 0) {
        const mag = this.shakeTrauma * this.shakeTrauma * 10;
        shakeX = (Math.random() * 2 - 1) * mag;
        shakeY = (Math.random() * 2 - 1) * mag;
        this.shakeTrauma = Math.max(0, this.shakeTrauma - rawDt * 2.4);
      }

      this.cameras.main.centerOn(this.camFollowX + shakeX, this.camFollowY + shakeY);
    }

    // 6. Ambient biome effects (if high quality)
    this.updateAmbientBiome(rawDt, map.palette.ambientEffect, map.width, map.height);
    this.particles.update(rawDt);
  }

  private updateAttract(dt: number): void {
    this.attractTime += dt;
    const map = ARENA_MAPS[this.activeMapId];
    this.cameras.main.centerOn(map.width * 0.5, map.height * 0.5);

    if (this.attractPropA) {
      const hull = this.attractPropA.list[0] as Phaser.GameObjects.Image;
      const turret = this.attractPropA.list[1] as Phaser.GameObjects.Image;
      hull.rotation += dt * 1.8;
      turret.rotation = hull.rotation;
    }
    if (this.attractPropB) {
      const hull = this.attractPropB.list[0] as Phaser.GameObjects.Image;
      const turret = this.attractPropB.list[1] as Phaser.GameObjects.Image;
      hull.rotation -= dt * 1.8;
      turret.rotation = hull.rotation;
    }

    this.updateAmbientBiome(dt, map.palette.ambientEffect, map.width, map.height);
  }

  private updateAmbientBiome(
    dt: number,
    effect: string,
    width: number,
    height: number
  ): void {
    if (this.graphicsQuality !== 'high' || effect === 'none') return;
    this.ambientAccumulator += dt;
    if (this.ambientAccumulator < 0.22) return;
    this.ambientAccumulator = 0;

    const view = this.cameras.main.worldView;
    const rx = view.x + Math.random() * view.width;
    const ry = view.y + Math.random() * view.height;
    if (rx < 0 || rx > width || ry < 0 || ry > height) return;

    const tint =
      effect === 'embers' || effect === 'sparks'
        ? 0xf97316
        : effect === 'snow'
          ? 0xe0f2fe
          : effect === 'leaves'
            ? 0x4ade80
            : 0xd6b37c;

    this.particles.emitBurst(rx, ry, 1, {
      tint,
      minSpeed: 10,
      maxSpeed: 35,
      life: 1.1,
      startScale: 0.45,
      depth: 8,
    });
  }

  private clearActiveEntities(): void {
    for (const entry of this.tankVisuals.values()) {
      entry.sprite.destroy();
    }
    this.tankVisuals.clear();

    for (const vis of this.crateVisuals.values()) {
      vis.container.destroy();
    }
    this.crateVisuals.clear();

    for (const vis of this.projectileVisuals.values()) {
      vis.sprite.destroy();
    }
    this.projectileVisuals.clear();

    this.localPredTank = null;
    this.latestSnapshot = null;
    this.localFlipState = { pendingClicks: 0, lastClickAt: 0 };
    this.redFlagSprite?.setVisible(false);
    this.blueFlagSprite?.setVisible(false);
    this.particles?.clearAll();
  }
}
