import { normalizeAngle } from '../src/shared/physics.ts';
import type { BotDifficulty, GameMode, TankEntity } from '../src/shared/types.ts';
import { isTeamMode } from '../src/shared/types.ts';

export interface BotDecision {
  thrust: boolean;
  wantShoot: boolean;
  wantFlip: boolean;
}

interface DiffProfile {
  alignRad: number;
  fireChance: number;
  thrustChance: number;
  aimJitter: number;
  flipChance: number;
}

const PROFILES: Record<BotDifficulty, DiffProfile> = {
  noob: {
    alignRad: (28 * Math.PI) / 180,
    fireChance: 0.32,
    thrustChance: 0.55,
    aimJitter: 0.45,
    flipChance: 0.04,
  },
  player: {
    alignRad: (14 * Math.PI) / 180,
    fireChance: 0.72,
    thrustChance: 0.88,
    aimJitter: 0.16,
    flipChance: 0.08,
  },
  pro: {
    alignRad: (7 * Math.PI) / 180,
    fireChance: 0.95,
    thrustChance: 1,
    aimJitter: 0.05,
    flipChance: 0.12,
  },
};

function isEnemy(self: TankEntity, other: TankEntity, mode: GameMode): boolean {
  if (!other.alive || !other.connected || other.id === self.id) return false;
  if (isTeamMode(mode) && other.team === self.team) return false;
  return true;
}

function pickTarget(self: TankEntity, tanks: TankEntity[], mode: GameMode): TankEntity | null {
  let best: TankEntity | null = null;
  let bestDist = Infinity;
  for (const t of tanks) {
    if (!isEnemy(self, t, mode)) continue;
    const d = (t.x - self.x) ** 2 + (t.y - self.y) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = t;
    }
  }
  return best;
}

/** Decide thrust / shoot / flip for one bot tank this tick. */
export function decideBotAction(
  self: TankEntity,
  tanks: TankEntity[],
  mode: GameMode,
  difficulty: BotDifficulty,
  rng: () => number = Math.random
): BotDecision {
  const profile = PROFILES[difficulty] ?? PROFILES.player;
  const target = pickTarget(self, tanks, mode);
  if (!target || !self.alive) {
    return { thrust: false, wantShoot: false, wantFlip: rng() < profile.flipChance * 0.25 };
  }

  const toTarget = Math.atan2(target.y - self.y, target.x - self.x);
  const jitter = (rng() - 0.5) * 2 * profile.aimJitter;
  const desired = normalizeAngle(toTarget + jitter);
  const diff = Math.abs(normalizeAngle(desired - self.angle));
  const aligned = diff <= profile.alignRad;

  // Release thrust when badly misaligned so auto-rotation can catch up
  const thrust = aligned && rng() < profile.thrustChance;

  // Occasional flip when stuck off-angle helps bots reverse spin toward target
  const wantFlip =
    (!aligned && diff > profile.alignRad * 2.2 && rng() < profile.flipChance) ||
    (aligned && rng() < profile.flipChance * 0.15);

  const wantShoot = aligned && rng() < profile.fireChance;

  return { thrust, wantShoot, wantFlip };
}
