import Phaser from 'phaser';
import { hasPowerUp } from '../shared/physics';
import { TankEntity } from '../shared/types';

export class TankSprite {
  readonly container: Phaser.GameObjects.Container;
  private hull: Phaser.GameObjects.Image;
  private turret: Phaser.GameObjects.Image;
  private shieldRing: Phaser.GameObjects.Image;
  private flagBadge: Phaser.GameObjects.Image;
  private uiLayer: Phaser.GameObjects.Container;
  private hpBg: Phaser.GameObjects.Rectangle;
  private hpFill: Phaser.GameObjects.Rectangle;
  private nameText: Phaser.GameObjects.Text;
  private recoilOffset = 0;
  private hitFlashUntil = 0;
  private lastSkinKey = '';
  private stunGfx: Phaser.GameObjects.Graphics;
  private concealment: 'none' | 'ghost' | 'hidden' = 'none';

  constructor(
    private scene: Phaser.Scene,
    tank: TankEntity,
    private isLocal: boolean
  ) {
    this.container = scene.add.container(tank.x, tank.y);
    this.container.setDepth(15);

    const skinKey = this.resolveSkinKey(tank);
    this.lastSkinKey = skinKey;

    this.hull = scene.add.image(0, 0, `tank_hull_${skinKey}`);
    this.turret = scene.add.image(0, 0, `tank_turret_${skinKey}`);
    this.turret.setOrigin(0.5, 0.5);

    this.shieldRing = scene.add.image(0, 0, 'shield_ring');
    this.shieldRing.setVisible(false);

    this.flagBadge = scene.add.image(0, -34, 'flag_red');
    this.flagBadge.setScale(0.65);
    this.flagBadge.setVisible(false);

    this.stunGfx = scene.add.graphics();
    this.stunGfx.setVisible(false);
    this.container.add([this.hull, this.turret, this.shieldRing, this.flagBadge, this.stunGfx]);

    // Non-rotating overhead HUD (HP bar + nickname)
    this.uiLayer = scene.add.container(tank.x, tank.y - 34);
    this.uiLayer.setDepth(22);

    this.hpBg = scene.add.rectangle(0, 0, 44, 6, 0x0f172a, 0.85);
    this.hpBg.setStrokeStyle(1, 0x334155);
    this.hpFill = scene.add.rectangle(-21, 0, 42, 4, 0x10b981, 1);
    this.hpFill.setOrigin(0, 0.5);

    const nameColor =
      tank.team === 'red'
        ? '#fca5a5'
        : tank.team === 'blue'
          ? '#93c5fd'
          : isLocal
            ? '#fde047'
            : '#f8fafc';

    this.nameText = scene.add
      .text(0, -11, tank.nickname, {
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: nameColor,
        stroke: '#090d16',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.uiLayer.add([this.hpBg, this.hpFill, this.nameText]);
  }

  private resolveSkinKey(tank: TankEntity): string {
    if (tank.team === 'red') return 'red';
    if (tank.team === 'blue') return 'blue';
    return String(tank.skinIndex % 7);
  }

  /** Grass concealment: hidden (enemies can't see), ghost (you / allies see a faded tank). */
  setConcealment(mode: 'none' | 'ghost' | 'hidden'): void {
    this.concealment = mode;
  }

  triggerRecoil(): void {
    this.recoilOffset = 7;
  }

  triggerHitFlash(): void {
    this.hitFlashUntil = performance.now() + 75;
  }

  update(
    x: number,
    y: number,
    hullAngle: number,
    aimAngle: number,
    tank: TankEntity,
    nowMs: number,
    dt: number
  ): void {
    const skinKey = this.resolveSkinKey(tank);
    if (skinKey !== this.lastSkinKey) {
      this.lastSkinKey = skinKey;
      this.hull.setTexture(`tank_hull_${skinKey}`);
      this.turret.setTexture(`tank_turret_${skinKey}`);
    }

    const visible = tank.alive && tank.connected;
    this.container.setVisible(visible);
    this.uiLayer.setVisible(visible);
    if (!visible) return;

    this.container.setPosition(x, y);
    this.uiLayer.setPosition(x, y - 36);

    this.hull.setRotation(hullAngle);
    this.turret.setRotation(hullAngle);

    // Recoil spring back along facing direction
    if (this.recoilOffset > 0.05) {
      this.recoilOffset *= Math.pow(0.75, dt * 60);
      this.turret.setPosition(
        -Math.cos(hullAngle) * this.recoilOffset,
        -Math.sin(hullAngle) * this.recoilOffset
      );
    } else {
      this.recoilOffset = 0;
      this.turret.setPosition(0, 0);
    }

    // Invincibility or Shield power-up visual
    const isInvincible = tank.invincibleUntil > nowMs;
    const hasShield = hasPowerUp(tank, 'shield', nowMs);
    const hasGust = (tank.gustShieldUntil ?? 0) > nowMs;
    if (isInvincible || hasShield || hasGust) {
      this.shieldRing.setVisible(true);
      this.shieldRing.rotation += dt * 2.6;
      this.shieldRing.setTint(hasGust ? 0xa855f7 : hasShield ? 0x22d3ee : 0xfef08a);
      this.container.setAlpha(
        isInvincible ? 0.55 + Math.sin(nowMs * 0.02) * 0.3 : 1
      );
    } else {
      this.shieldRing.setVisible(false);
      this.container.setAlpha(1);
    }

    // Stun: dizzy sparks orbit the hull
    if ((tank.stunnedUntil ?? 0) > nowMs) {
      this.stunGfx.setVisible(true);
      this.stunGfx.clear();
      const spin = nowMs * 0.012;
      for (let i = 0; i < 4; i++) {
        const a = spin + (i * Math.PI) / 2;
        const px = Math.cos(a) * 26;
        const py = Math.sin(a) * 26;
        this.stunGfx.fillStyle(0xfde047, 1);
        this.stunGfx.fillCircle(px, py, 3.2);
        this.stunGfx.fillStyle(0xffffff, 0.9);
        this.stunGfx.fillCircle(px, py, 1.4);
      }
      this.stunGfx.lineStyle(2, 0xfde047, 0.45);
      this.stunGfx.strokeCircle(0, 0, 26);
    } else if (this.stunGfx.visible) {
      this.stunGfx.setVisible(false);
      this.stunGfx.clear();
    }

    // Grass concealment
    if (this.concealment === 'hidden') {
      this.container.setVisible(false);
      this.uiLayer.setVisible(false);
      return;
    }
    if (this.concealment === 'ghost') {
      this.container.setAlpha(Math.min(this.container.alpha, 0.5));
    }

    // Hit flash
    if (performance.now() < this.hitFlashUntil) {
      this.hull.setTint(0xffffff);
      this.hull.setTintFill();
      this.turret.setTint(0xffffff);
      this.turret.setTintFill();
    } else {
      this.hull.clearTint();
      this.turret.clearTint();
    }

    // Carried flag indicator
    if (tank.carryingFlag === 'red' || tank.carryingFlag === 'blue') {
      this.flagBadge.setVisible(true);
      this.flagBadge.setTexture(`flag_${tank.carryingFlag}`);
      this.uiLayer.setPosition(x, y - 50);
    } else {
      this.flagBadge.setVisible(false);
    }

    // Health bar fill
    const ratio = Math.max(0, Math.min(1, tank.hp / tank.maxHp));
    this.hpFill.setDisplaySize(42 * ratio, 4);
    this.hpFill.setFillStyle(
      ratio > 0.55 ? 0x10b981 : ratio > 0.25 ? 0xf59e0b : 0xef4444
    );
  }

  destroy(): void {
    this.container.destroy();
    this.uiLayer.destroy();
  }
}
