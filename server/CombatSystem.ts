import { ASSIST_WINDOW_MS, TANK_RADIUS } from '../src/shared/config.ts';
import { hasPowerUp, selectSafeSpawn, stepProjectile } from '../src/shared/physics.ts';
import { applyTankDamage, canTankFire, consumeAmmo } from '../src/shared/rules.ts';
import type {
  ArenaMap,
  GameMode,
  GameSettings,
  ProjectileEntity,
  TankEntity,
} from '../src/shared/types.ts';

export interface CombatEventCallbacks {
  onShotFired: (proj: ProjectileEntity, shooter: TankEntity) => void;
  onProjectileImpact: (x: number, y: number, hitTankId: string | null, damage: number, blocked: boolean) => void;
  onTankKilled: (victim: TankEntity, killer: TankEntity | null, assisters: TankEntity[]) => void;
  onTankRespawned: (tank: TankEntity) => void;
}

export class CombatSystem {
  private projCounter = 0;
  private damageHistory = new Map<string, Map<string, number>>(); // victimId -> (attackerId -> timestamp)

  reset(): void {
    this.projCounter = 0;
    this.damageHistory.clear();
  }

  tryFire(
    shooter: TankEntity,
    settings: GameSettings,
    nowMs: number,
    projectiles: ProjectileEntity[],
    callbacks: CombatEventCallbacks
  ): ProjectileEntity | null {
    if (!canTankFire(shooter, nowMs, settings)) return null;

    const fireAngle = shooter.angle;
    shooter.aimAngle = fireAngle;
    shooter.lastShotAt = nowMs;
    consumeAmmo(shooter, nowMs);

    const muzzleDist = TANK_RADIUS + 8;
    const spawnX = shooter.x + Math.cos(fireAngle) * muzzleDist;
    const spawnY = shooter.y + Math.sin(fireAngle) * muzzleDist;
    const isDoubleDamage = hasPowerUp(shooter, 'double_damage', nowMs);

    const proj: ProjectileEntity = {
      id: `p_${++this.projCounter}`,
      ownerId: shooter.id,
      team: shooter.team,
      x: spawnX,
      y: spawnY,
      vx: Math.cos(fireAngle) * settings.projectileSpeed,
      vy: Math.sin(fireAngle) * settings.projectileSpeed,
      damage: settings.projectileDamage,
      distanceTraveled: 0,
      maxRange: settings.projectileRange,
      isDoubleDamage,
    };

    projectiles.push(proj);
    callbacks.onShotFired(proj, shooter);
    return proj;
  }

  stepProjectiles(
    dt: number,
    projectiles: ProjectileEntity[],
    tanks: TankEntity[],
    map: ArenaMap,
    mode: GameMode,
    settings: GameSettings,
    nowMs: number,
    callbacks: CombatEventCallbacks
  ): void {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const proj = projectiles[i];
      const stepRes = stepProjectile(proj, dt, map, tanks);

      if (!stepRes.expired) continue;

      if (stepRes.hitTankId) {
        const victim = tanks.find((t) => t.id === stepRes.hitTankId);
        if (victim) {
          const dmgRes = applyTankDamage(
            victim,
            proj.ownerId,
            proj.team,
            proj.damage,
            proj.isDoubleDamage,
            mode,
            nowMs
          );

          if (dmgRes.blockedReason === 'friendly') {
            // Friendly shells pass through teammates in CTF without detonating
            continue;
          }

          if (dmgRes.appliedDamage > 0) {
            this.recordDamage(victim.id, proj.ownerId, nowMs);
            callbacks.onProjectileImpact(
              stepRes.impactX,
              stepRes.impactY,
              victim.id,
              dmgRes.appliedDamage,
              false
            );
          } else {
            callbacks.onProjectileImpact(
              stepRes.impactX,
              stepRes.impactY,
              victim.id,
              0,
              true
            );
          }

          if (dmgRes.eliminated) {
            victim.respawnAt = nowMs + settings.respawnDelayMs;
            victim.activePowerUps = [];
            victim.vx = 0;
            victim.vy = 0;

            const killer = tanks.find((t) => t.id === proj.ownerId) ?? null;
            const assisters = this.consumeAssisters(victim.id, proj.ownerId, tanks, nowMs);
            callbacks.onTankKilled(victim, killer, assisters);
          }
        }
      } else if (stepRes.hitWall) {
        callbacks.onProjectileImpact(stepRes.impactX, stepRes.impactY, null, 0, false);
      }

      projectiles.splice(i, 1);
    }
  }

  stepRespawns(
    tanks: TankEntity[],
    map: ArenaMap,
    mode: GameMode,
    settings: GameSettings,
    nowMs: number,
    callbacks: CombatEventCallbacks
  ): void {
    for (const tank of tanks) {
      if (tank.alive || !tank.connected) continue;
      if (nowMs >= tank.respawnAt) {
        const spawns =
          mode === 'ctf'
            ? tank.team === 'red'
              ? map.redSpawns
              : map.blueSpawns
            : map.ffaSpawns;
        const enemies = tanks.filter((other) => {
          if (other.id === tank.id) return false;
          if (mode === 'ctf' && other.team === tank.team) return false;
          return true;
        });

        const spawnPos = selectSafeSpawn(spawns, enemies, map.obstacles);
        tank.x = spawnPos.x;
        tank.y = spawnPos.y;
        tank.vx = 0;
        tank.vy = 0;
        tank.hp = tank.maxHp;
        tank.ammo = tank.maxAmmo;
        tank.ammoRegenProgress = 0;
        tank.activePowerUps = [];
        tank.alive = true;
        tank.invincibleUntil = nowMs + settings.invincibilityDurationMs;

        callbacks.onTankRespawned(tank);
      }
    }
  }

  private recordDamage(victimId: string, attackerId: string, nowMs: number): void {
    let map = this.damageHistory.get(victimId);
    if (!map) {
      map = new Map();
      this.damageHistory.set(victimId, map);
    }
    map.set(attackerId, nowMs);
  }

  private consumeAssisters(
    victimId: string,
    killerId: string,
    tanks: TankEntity[],
    nowMs: number
  ): TankEntity[] {
    const map = this.damageHistory.get(victimId);
    this.damageHistory.delete(victimId);
    if (!map) return [];

    const assisters: TankEntity[] = [];
    for (const [attackerId, ts] of map.entries()) {
      if (attackerId === killerId) continue;
      if (nowMs - ts <= ASSIST_WINDOW_MS) {
        const t = tanks.find((tank) => tank.id === attackerId);
        if (t) assisters.push(t);
      }
    }
    return assisters;
  }
}
