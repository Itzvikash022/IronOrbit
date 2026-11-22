import { PROJECTILE_RADIUS, TANK_RADIUS } from '../src/shared/config.ts';
import {
  generateMapHazards,
  getActiveBomb,
  getMapWindAt,
  getSurfaceAt,
  HAZARD_TUNING,
  isHostileTurretTarget,
  effectiveTurretTeam,
  turretsToEntities,
  windAcceleration,
  type TurretSpec,
  type WindState,
} from '../src/shared/hazards.ts';
import {
  hasPowerUp,
  normalizeAngle,
  segmentIntersectsRect,
} from '../src/shared/physics.ts';
import type {
  ArenaMap,
  GameMode,
  GameSettings,
  HazardZone,
  ProjectileEntity,
  SurfaceKind,
  TankEntity,
  TurretEntity,
} from '../src/shared/types.ts';

export interface HazardCallbacks {
  onTurretShot: (proj: ProjectileEntity, turret: TurretEntity) => void;
  /** Lava (or other environment) damage. Returns nothing; GameRoom/Combat handle kills. */
  onEnvironmentDamage: (victim: TankEntity, amount: number, nowMs: number) => void;
  onBombDetonated: (x: number, y: number, radius: number) => void;
}

interface TurretState {
  spec: TurretSpec;
  entity: TurretEntity;
  lastShotAt: number;
}

/** Server-side owner of per-match hazard state (zones, turrets, bombs, lava timers). */
export class HazardSystem {
  private map: ArenaMap | null = null;
  private seed = 0;
  private matchStart = 0;
  private zones: HazardZone[] = [];
  private turrets: TurretState[] = [];
  private lavaAcc = new Map<string, number>(); // fractional lava damage per tank
  private lavaEnteredAt = new Map<string, number>();
  private detonatedBombs = new Set<string>();
  private projCounter = 0;

  reset(map: ArenaMap, seed: number, matchStartMs: number): void {
    this.map = map;
    this.seed = seed;
    this.matchStart = matchStartMs;
    const hazards = generateMapHazards(map, seed);
    this.zones = hazards.zones;
    this.turrets = hazards.turrets.map((spec) => ({
      spec,
      entity: turretsToEntities([spec])[0],
      lastShotAt: matchStartMs + 2500, // brief grace so nobody is shot at spawn
    }));
    this.lavaAcc.clear();
    this.lavaEnteredAt.clear();
    this.detonatedBombs.clear();
    this.projCounter = 0;
  }

  getZones(): HazardZone[] {
    return this.zones;
  }

  getTurretEntities(): TurretEntity[] {
    return this.turrets.map((t) => t.entity);
  }

  surfaceAt(x: number, y: number): SurfaceKind {
    return getSurfaceAt(this.zones, x, y);
  }

  currentWind(nowMs: number): WindState {
    if (!this.map) return { active: false, warning: false, angle: 0, strength: 0 };
    return getMapWindAt(this.map, this.seed, nowMs - this.matchStart);
  }

  windAccelAt(nowMs: number): { ax: number; ay: number } {
    return windAcceleration(this.currentWind(nowMs));
  }

  tick(
    nowMs: number,
    dt: number,
    tanks: TankEntity[],
    projectiles: ProjectileEntity[],
    mode: GameMode,
    settings: GameSettings,
    cb: HazardCallbacks
  ): void {
    if (!this.map) return;
    this.tickLava(nowMs, dt, tanks, cb);
    this.tickBombs(nowMs, tanks, cb);
    this.tickTurrets(nowMs, dt, tanks, projectiles, mode, settings, cb);
  }

  // -------------------------------------------------------------------------

  private tickLava(nowMs: number, dt: number, tanks: TankEntity[], cb: HazardCallbacks): void {
    if (!this.zones.some((z) => z.kind === 'lava')) return;
    const T = HAZARD_TUNING;
    for (const tank of tanks) {
      if (!tank.alive) {
        this.lavaAcc.delete(tank.id);
        this.lavaEnteredAt.delete(tank.id);
        continue;
      }
      if (this.surfaceAt(tank.x, tank.y) !== 'lava') {
        this.lavaAcc.delete(tank.id);
        this.lavaEnteredAt.delete(tank.id);
        continue;
      }
      if (!this.lavaEnteredAt.has(tank.id)) this.lavaEnteredAt.set(tank.id, nowMs);
      if (nowMs - (this.lavaEnteredAt.get(tank.id) ?? nowMs) < T.lavaGraceMs) continue;

      const acc = (this.lavaAcc.get(tank.id) ?? 0) + T.lavaDps * dt;
      const whole = Math.floor(acc);
      this.lavaAcc.set(tank.id, acc - whole);
      if (whole >= 1) cb.onEnvironmentDamage(tank, whole, nowMs);
    }
  }

  private tickBombs(nowMs: number, tanks: TankEntity[], cb: HazardCallbacks): void {
    if (!this.map?.hazardSpec?.bombs) return;
    const elapsed = nowMs - this.matchStart;
    const bomb = getActiveBomb(this.map, this.seed, elapsed);
    if (!bomb || elapsed < bomb.detonateAt || this.detonatedBombs.has(bomb.id)) return;
    this.detonatedBombs.add(bomb.id);

    const T = HAZARD_TUNING;
    for (const tank of tanks) {
      if (!tank.alive) continue;
      if (Math.hypot(tank.x - bomb.x, tank.y - bomb.y) > bomb.radius + TANK_RADIUS * 0.5) continue;
      if (tank.invincibleUntil > nowMs || hasPowerUp(tank, 'shield', nowMs)) continue;
      tank.stunnedUntil = nowMs + T.bombStunMs;
    }
    cb.onBombDetonated(bomb.x, bomb.y, bomb.radius);
  }

  private tickTurrets(
    nowMs: number,
    dt: number,
    tanks: TankEntity[],
    projectiles: ProjectileEntity[],
    mode: GameMode,
    settings: GameSettings,
    cb: HazardCallbacks
  ): void {
    if (this.turrets.length === 0 || !this.map) return;
    const T = HAZARD_TUNING;
    const map = this.map;

    for (const state of this.turrets) {
      const { spec, entity } = state;

      // Pick nearest hostile, visible, vulnerable target in range
      let target: TankEntity | null = null;
      let bestDist: number = T.turretRange;
      for (const tank of tanks) {
        if (!tank.alive || !tank.connected) continue;
        if (!isHostileTurretTarget(spec.team, tank.team, mode)) continue;
        if (tank.invincibleUntil > nowMs) continue;
        const dist = Math.hypot(tank.x - spec.x, tank.y - spec.y);
        if (dist >= bestDist) continue;
        if (!this.hasLineOfSight(map, spec.x, spec.y, tank.x, tank.y)) continue;
        target = tank;
        bestDist = dist;
      }

      if (!target) {
        // Idle sweep around the mounted direction
        const sweep = spec.facing + Math.sin((nowMs - this.matchStart) / 1000 * 0.7 + spec.x) * 0.9;
        const diff = normalizeAngle(sweep - entity.angle);
        const maxTurn = T.turretTurnRate * 0.5 * dt;
        entity.angle = normalizeAngle(entity.angle + Math.max(-maxTurn, Math.min(maxTurn, diff)));
        entity.charge = Math.min(1, (nowMs - state.lastShotAt) / T.turretCooldownMs);
        continue;
      }

      const desired = Math.atan2(target.y - spec.y, target.x - spec.x);
      const diff = normalizeAngle(desired - entity.angle);
      const maxTurn = T.turretTurnRate * dt;
      entity.angle = normalizeAngle(entity.angle + Math.max(-maxTurn, Math.min(maxTurn, diff)));
      entity.charge = Math.min(1, (nowMs - state.lastShotAt) / T.turretCooldownMs);

      const aimErr = Math.abs(normalizeAngle(desired - entity.angle));
      if (aimErr <= T.turretAimTolerance && nowMs - state.lastShotAt >= T.turretCooldownMs) {
        state.lastShotAt = nowMs;
        entity.charge = 0;
        const muzzle = T.turretRadius + PROJECTILE_RADIUS + 2;
        const speed = settings.projectileSpeed * T.turretProjectileSpeedMul;
        const proj: ProjectileEntity = {
          id: `tp_${++this.projCounter}`,
          ownerId: spec.id,
          team: effectiveTurretTeam(spec.team, mode),
          x: spec.x + Math.cos(entity.angle) * muzzle,
          y: spec.y + Math.sin(entity.angle) * muzzle,
          vx: Math.cos(entity.angle) * speed,
          vy: Math.sin(entity.angle) * speed,
          damage: T.turretDamage,
          distanceTraveled: 0,
          maxRange: T.turretRange + 60,
          isDoubleDamage: false,
        };
        projectiles.push(proj);
        cb.onTurretShot(proj, entity);
      }
    }
  }

  private hasLineOfSight(map: ArenaMap, x1: number, y1: number, x2: number, y2: number): boolean {
    for (const obs of map.obstacles) {
      if (segmentIntersectsRect(x1, y1, x2, y2, obs)) return false;
    }
    return true;
  }
}
