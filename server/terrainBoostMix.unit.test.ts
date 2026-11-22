import test from "node:test";
import assert from "node:assert/strict";
import { PowerUpManager } from "./PowerUpManager.ts";
import { ARENA_MAPS } from "../src/shared/maps.ts";
import { ALL_POWERUP_TYPES, DEFAULT_GAME_SETTINGS } from "../src/shared/config.ts";
import type { SupplyCrateEntity, TankEntity } from "../src/shared/types.ts";

function tank(overrides: Partial<TankEntity> = {}): TankEntity {
  return {
    id: "p1", nickname: "A", team: "red", skinIndex: 0, x: 10, y: 10, vx: 0, vy: 0,
    angle: 0, aimAngle: 0, rotationDir: 1, hp: 100, maxHp: 100, ammo: 6, maxAmmo: 6,
    ammoRegenProgress: 0, lastShotAt: 0, alive: true, respawnAt: 0, invincibleUntil: 0,
    activePowerUps: [], kills: 0, deaths: 0, assists: 0, captures: 0, score: 0,
    carryingFlag: "none", connected: true, lastProcessedSeq: 0, terrainCharges: 0, ...overrides,
  };
}

test("terrain maps spawn ~25% terrain_boost and otherwise normal boosts", () => {
  const mgr = new PowerUpManager();
  const map = ARENA_MAPS.dunes;
  const tanks = [tank()];
  let terrain = 0;
  let normal = 0;
  const N = 400;
  // Force spawn by advancing lastSpawnAt via reset + tick with empty crates and short interval
  const settings = { ...DEFAULT_GAME_SETTINGS, crateSpawnIntervalMs: 1, maxActiveCrates: 1 };
  for (let i = 0; i < N; i++) {
    mgr.reset(i * 100);
    const crates: SupplyCrateEntity[] = [];
    mgr.tick(crates, tanks, map, settings, i * 100 + 50, {
      onCrateSpawned: (c) => {
        if (c.powerUp === "terrain_boost") terrain += 1;
        else {
          assert.ok(ALL_POWERUP_TYPES.includes(c.powerUp as never), String(c.powerUp));
          normal += 1;
        }
      },
      onCrateCollected: () => {},
    });
  }
  const share = terrain / (terrain + normal);
  assert.ok(terrain + normal > N * 0.8, "most ticks spawned a crate");
  assert.ok(share > 0.15 && share < 0.35, `terrain share ${share.toFixed(2)} should be ~0.25`);
  assert.ok(normal > 0, "normal boosts still spawn on terrain maps");
});
