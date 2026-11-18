import Phaser from 'phaser';

interface PooledParticle {
  sprite: Phaser.GameObjects.Image;
  active: boolean;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  startScale: number;
  endScale: number;
  drag: number;
}

export class ParticlePool {
  private pool: PooledParticle[] = [];

  constructor(private scene: Phaser.Scene, capacity = 180) {
    for (let i = 0; i < capacity; i++) {
      const sprite = scene.add.image(-9999, -9999, 'particle_spark');
      sprite.setVisible(false);
      sprite.setDepth(25);
      this.pool.push({
        sprite,
        active: false,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        startScale: 1,
        endScale: 0,
        drag: 0.94,
      });
    }
  }

  emitBurst(
    x: number,
    y: number,
    count: number,
    options: {
      texture?: 'particle_spark' | 'particle_smoke';
      tint?: number;
      minSpeed?: number;
      maxSpeed?: number;
      life?: number;
      startScale?: number;
      endScale?: number;
      depth?: number;
    } = {}
  ): void {
    const texture = options.texture ?? 'particle_spark';
    const minSpeed = options.minSpeed ?? 50;
    const maxSpeed = options.maxSpeed ?? 220;
    const life = options.life ?? 0.38;
    const startScale = options.startScale ?? 1.0;
    const endScale = options.endScale ?? 0.05;
    const depth = options.depth ?? 25;

    let spawned = 0;
    for (let i = 0; i < this.pool.length && spawned < count; i++) {
      const p = this.pool[i];
      if (p.active) continue;

      const angle = Math.random() * Math.PI * 2;
      const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);

      p.active = true;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = 0;
      p.maxLife = life * (0.75 + Math.random() * 0.5);
      p.startScale = startScale * (0.8 + Math.random() * 0.4);
      p.endScale = endScale;
      p.drag = texture === 'particle_smoke' ? 0.91 : 0.94;

      p.sprite.setTexture(texture);
      p.sprite.setPosition(x, y);
      p.sprite.setScale(p.startScale);
      p.sprite.setAlpha(1);
      p.sprite.setDepth(depth);
      if (options.tint !== undefined) {
        p.sprite.setTint(options.tint);
      } else {
        p.sprite.clearTint();
      }
      p.sprite.setVisible(true);
      spawned++;
    }
  }

  emitDirectional(
    x: number,
    y: number,
    dirAngle: number,
    spread: number,
    count: number,
    tint?: number
  ): void {
    let spawned = 0;
    for (let i = 0; i < this.pool.length && spawned < count; i++) {
      const p = this.pool[i];
      if (p.active) continue;

      const angle = dirAngle + (Math.random() - 0.5) * spread;
      const speed = 90 + Math.random() * 190;
      p.active = true;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = 0;
      p.maxLife = 0.22 + Math.random() * 0.14;
      p.startScale = 0.75;
      p.endScale = 0.05;
      p.drag = 0.9;

      p.sprite.setTexture('particle_spark');
      p.sprite.setPosition(x, y);
      p.sprite.setScale(p.startScale);
      p.sprite.setAlpha(1);
      p.sprite.setDepth(24);
      if (tint !== undefined) p.sprite.setTint(tint);
      else p.sprite.clearTint();
      p.sprite.setVisible(true);
      spawned++;
    }
  }

  update(dt: number): void {
    const dampingPow = dt * 60;
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.sprite.setVisible(false);
        continue;
      }

      const t = p.life / p.maxLife;
      const factor = Math.pow(p.drag, dampingPow);
      p.vx *= factor;
      p.vy *= factor;
      p.sprite.x += p.vx * dt;
      p.sprite.y += p.vy * dt;
      p.sprite.setScale(p.startScale + (p.endScale - p.startScale) * t);
      p.sprite.setAlpha(1 - t);
    }
  }

  clearAll(): void {
    for (const p of this.pool) {
      p.active = false;
      p.sprite.setVisible(false);
    }
  }
}
