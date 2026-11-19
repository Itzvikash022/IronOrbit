import { ALL_POWERUP_TYPES, CRATE_RADIUS, TANK_RADIUS } from '../src/shared/config.ts';
import { distanceSq, findValidCratePosition } from '../src/shared/physics.ts';
import { activatePowerUp, pruneExpiredPowerUps } from '../src/shared/rules.ts';
import type {
  ArenaMap,
  GameSettings,
  PowerUpType,
  SupplyCrateEntity,
  TankEntity,
} from '../src/shared/types.ts';

export interface PowerUpCallbacks {
  onCrateSpawned: (crate: SupplyCrateEntity) => void;
  onCrateCollected: (crate: SupplyCrateEntity, collector: TankEntity) => void;
}

export class PowerUpManager {
  private crateCounter = 0;
  private lastSpawnAt = 0;

  reset(nowMs: number): void {
    this.crateCounter = 0;
    this.lastSpawnAt = nowMs;
  }

  tick(
    crates: SupplyCrateEntity[],
    tanks: TankEntity[],
    map: ArenaMap,
    settings: GameSettings,
    nowMs: number,
    callbacks: PowerUpCallbacks
  ): void {
    // 1. Prune expired power-ups on tanks
    for (const tank of tanks) {
      pruneExpiredPowerUps(tank, nowMs);
    }

    // 2. Despawn uncollected crates past lifetime
    for (let i = crates.length - 1; i >= 0; i--) {
      if (nowMs >= crates[i].expiresAt) {
        crates.splice(i, 1);
      }
    }

    // 3. Check crate collection by driving over them
    const pickupDistSq = (TANK_RADIUS + CRATE_RADIUS) ** 2;
    for (let i = crates.length - 1; i >= 0; i--) {
      const crate = crates[i];
      for (const tank of tanks) {
        if (!tank.alive || !tank.connected) continue;
        if (distanceSq(tank.x, tank.y, crate.x, crate.y) <= pickupDistSq) {
          activatePowerUp(tank, crate.powerUp, nowMs, settings);
          crates.splice(i, 1);
          callbacks.onCrateCollected(crate, tank);
          break;
        }
      }
    }

    // 4. Cap active boosts at 3; while full, anchor spawn timer so a replacement spawns only after one is taken
    const maxCrates = Math.max(1, Math.min(3, settings.maxActiveCrates));
    if (crates.length >= maxCrates) {
      this.lastSpawnAt = nowMs;
      return;
    }

    if (nowMs - this.lastSpawnAt >= settings.crateSpawnIntervalMs) {
      this.lastSpawnAt = nowMs;
      const pos = findValidCratePosition(map, crates, tanks);
      if (pos) {
        const powerUp = this.pickRandomPowerUp();
        const crate: SupplyCrateEntity = {
          id: `c_${++this.crateCounter}`,
          x: pos.x,
          y: pos.y,
          powerUp,
          spawnedAt: nowMs,
          expiresAt: nowMs + settings.crateDespawnMs,
        };
        crates.push(crate);
        callbacks.onCrateSpawned(crate);
      }
    }
  }

  private pickRandomPowerUp(): PowerUpType {
    return ALL_POWERUP_TYPES[Math.floor(Math.random() * ALL_POWERUP_TYPES.length)];
  }
}
