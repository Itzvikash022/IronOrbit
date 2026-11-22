import test from "node:test";
import assert from "node:assert/strict";
import { PowerUpManager } from "./PowerUpManager.ts";
import { ARENA_MAPS } from "../src/shared/maps.ts";
import { DEFAULT_GAME_SETTINGS, TERRAIN_BOOST_CHARGES_REQUIRED } from "../src/shared/config.ts";
import type { SupplyCrateEntity, TankEntity } from "../src/shared/types.ts";

function tank(overrides: Partial<TankEntity> = {}): TankEntity {
  return {
    id: "p1", nickname: "A", team: "red", skinIndex: 0, x: 900, y: 600, vx: 0, vy: 0,
    angle: 0, aimAngle: 0, rotationDir: 1, hp: 100, maxHp: 100, ammo: 6, maxAmmo: 6,
    ammoRegenProgress: 0, lastShotAt: 0, alive: true, respawnAt: 0, invincibleUntil: 0,
    activePowerUps: [], kills: 0, deaths: 0, assists: 0, captures: 0, score: 0,
    carryingFlag: "none", connected: true, lastProcessedSeq: 0, terrainCharges: 0, ...overrides,
  };
}

test("terrain boost: third pickup fires ult callback and resets charges", () => {
  const mgr = new PowerUpManager();
  const map = ARENA_MAPS.glacier;
  const now = 10_000;
  mgr.reset(now);
  const collector = tank({ x: 500, y: 500 });
  const enemy = tank({ id: "p2", team: "blue", x: 800, y: 800 });
  let ultReady = 0;
  const crates: SupplyCrateEntity[] = [];
  for (let i = 0; i < TERRAIN_BOOST_CHARGES_REQUIRED; i++) {
    crates.push({ id: `c${i}`, x: 500, y: 500, powerUp: "terrain_boost", spawnedAt: now, expiresAt: now + 99999 });
    mgr.tick(crates, [collector, enemy], map, DEFAULT_GAME_SETTINGS, now + i, {
      onCrateSpawned: () => {},
      onCrateCollected: () => {},
      onTerrainUltReady: () => { ultReady += 1; },
    });
  }
  assert.equal(ultReady, 1);
  assert.equal(collector.terrainCharges ?? 0, 0);
});
