import {
  ALL_POWERUP_TYPES,
  CRATE_RADIUS,
  TANK_RADIUS,
  TERRAIN_BOOST_CHARGES_REQUIRED,
} from '../src/shared/config.ts';
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
  /** Fired when a tank reaches 3 terrain charges and the ultimate should trigger. */
  onTerrainUltReady?: (collector: TankEntity) => void;
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
    for (const tank of tanks) {
      pruneExpiredPowerUps(tank, nowMs);
    }

    for (let i = crates.length - 1; i >= 0; i--) {
      if (nowMs >= crates[i].expiresAt) {
        crates.splice(i, 1);
      }
    }

    const pickupDistSq = (TANK_RADIUS + CRATE_RADIUS) ** 2;
    for (let i = crates.length - 1; i >= 0; i--) {
      const crate = crates[i];
      for (const tank of tanks) {
        if (!tank.alive || !tank.connected) continue;
        if (distanceSq(tank.x, tank.y, crate.x, crate.y) <= pickupDistSq) {
          if (crate.powerUp === 'terrain_boost') {
            const charges = (tank.terrainCharges ?? 0) + 1;
            if (charges >= TERRAIN_BOOST_CHARGES_REQUIRED) {
              tank.terrainCharges = 0;
              callbacks.onTerrainUltReady?.(tank);
            } else {
              tank.terrainCharges = charges;
            }
          } else {
            activatePowerUp(tank, crate.powerUp, nowMs, settings);
          }
          crates.splice(i, 1);
          callbacks.onCrateCollected(crate, tank);
          break;
        }
      }
    }

    const maxCrates = Math.max(1, Math.min(3, settings.maxActiveCrates));
    if (crates.length >= maxCrates) {
      this.lastSpawnAt = nowMs;
      return;
    }

    if (nowMs - this.lastSpawnAt >= settings.crateSpawnIntervalMs) {
      this.lastSpawnAt = nowMs;
      const pos = findValidCratePosition(map, crates, tanks);
      if (pos) {
        const powerUp = this.pickPowerUp(map);
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

  private pickPowerUp(map: ArenaMap): PowerUpType {
    if (map.hazardSpec?.terrainUlt) return 'terrain_boost';
    return ALL_POWERUP_TYPES[Math.floor(Math.random() * ALL_POWERUP_TYPES.length)];
  }
}
