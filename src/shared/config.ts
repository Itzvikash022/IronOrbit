import type { GameSettings, PowerUpType } from './types.ts';

/**
 * Bump whenever client/server wire format or shared simulation changes in a way that makes
 * old and new builds desync. Mismatched clients are refused with a refresh prompt.
 */
export const PROTOCOL_VERSION = 2;

export const TANK_RADIUS = 20;
export const PROJECTILE_RADIUS = 8;
export const CRATE_RADIUS = 18;
export const FLAG_PICKUP_RADIUS = 28;
export const RAPID_FIRE_MULTIPLIER = 0.42;
export const SPEED_BOOST_MULTIPLIER = 1.48;
export const DOUBLE_DAMAGE_MULTIPLIER = 2;
export const HEALTH_RESTORE_AMOUNT = 45;
export const ASSIST_WINDOW_MS = 6000;
export const RECONNECT_GRACE_MS = 45000;

export const SCORING = {
  KILL: 100,
  ASSIST: 50,
  FLAG_CAPTURE: 250,
  TEAM_WIN_BONUS: 150,
} as const;

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  tankRotationSpeed: 2.35, // ~135 deg/sec smooth continuous spin
  tankMoveSpeed: 255,
  tankAcceleration: 1450,
  tankDeceleration: 1850,
  projectileSpeed: 720,
  projectileDamage: 100,
  projectileRange: 760,
  fireCooldownMs: 280,
  maxAmmo: 6,
  ammoRegenTimeMs: 1350,
  respawnDelayMs: 3000,
  invincibilityDurationMs: 3000,
  powerUpDurationMs: 8500,
  crateSpawnIntervalMs: 6500,
  crateDespawnMs: 22000,
  maxActiveCrates: 3,
  matchDurationSec: 300, // 5 minutes
  maxPlayersPerRoom: 12,
  serverTickRate: 25,
  dmWinMode: 'milestone',
  killTarget: 10,
  ctfWinMode: 'milestone',
  flagTarget: 3,
};

export function sanitizeGameSettings(
  input?: Partial<GameSettings>,
  base: GameSettings = DEFAULT_GAME_SETTINGS
): GameSettings {
  const merged: GameSettings = { ...base, ...input };
  const clampNum = (v: unknown, min: number, max: number, fallback: number): number => {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  };
  return {
    tankRotationSpeed: clampNum(merged.tankRotationSpeed, (45 * Math.PI) / 180, (360 * Math.PI) / 180, base.tankRotationSpeed),
    tankMoveSpeed: Math.round(clampNum(merged.tankMoveSpeed, 140, 420, base.tankMoveSpeed)),
    tankAcceleration: clampNum(merged.tankAcceleration, 600, 3000, base.tankAcceleration),
    tankDeceleration: clampNum(merged.tankDeceleration, 600, 3500, base.tankDeceleration),
    projectileSpeed: Math.round(clampNum(merged.projectileSpeed, 400, 1200, base.projectileSpeed)),
    projectileDamage: Math.round(clampNum(merged.projectileDamage, 10, 100, base.projectileDamage)),
    projectileRange: Math.round(clampNum(merged.projectileRange, 400, 1400, base.projectileRange)),
    fireCooldownMs: Math.round(clampNum(merged.fireCooldownMs, 120, 1000, base.fireCooldownMs)),
    maxAmmo: Math.round(clampNum(merged.maxAmmo, 3, 10, base.maxAmmo)),
    ammoRegenTimeMs: Math.round(clampNum(merged.ammoRegenTimeMs, 500, 4000, base.ammoRegenTimeMs)),
    respawnDelayMs: Math.round(clampNum(merged.respawnDelayMs, 1000, 8000, base.respawnDelayMs)),
    invincibilityDurationMs: Math.round(clampNum(merged.invincibilityDurationMs, 1000, 6000, base.invincibilityDurationMs)),
    powerUpDurationMs: Math.round(clampNum(merged.powerUpDurationMs, 3000, 20000, base.powerUpDurationMs)),
    crateSpawnIntervalMs: Math.round(clampNum(merged.crateSpawnIntervalMs, 2500, 20000, base.crateSpawnIntervalMs)),
    crateDespawnMs: Math.round(clampNum(merged.crateDespawnMs, 8000, 45000, base.crateDespawnMs)),
    maxActiveCrates: 3,
    matchDurationSec: Math.round(clampNum(merged.matchDurationSec, 60, 900, base.matchDurationSec)),
    maxPlayersPerRoom: Math.round(clampNum(merged.maxPlayersPerRoom, 2, 16, base.maxPlayersPerRoom)),
    serverTickRate: Math.round(clampNum(merged.serverTickRate, 15, 40, base.serverTickRate)),
    dmWinMode: merged.dmWinMode === 'timed' ? 'timed' : 'milestone',
    killTarget: Math.round(clampNum(merged.killTarget, 3, 99, base.killTarget)),
    ctfWinMode: merged.ctfWinMode === 'timed' ? 'timed' : 'milestone',
    flagTarget: Math.round(clampNum(merged.flagTarget, 1, 15, base.flagTarget)),
  };
}

export interface PowerUpMeta {
  type: PowerUpType;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  accent: string;
  timed: boolean;
}

export const POWERUP_META: Record<PowerUpType, PowerUpMeta> = {
  speed: {
    type: 'speed',
    label: 'Speed Boost',
    shortLabel: 'SPD',
    description: '+48% forward drive velocity',
    color: '#0ea5e9',
    accent: '#bae6fd',
    timed: true,
  },
  infinite_ammo: {
    type: 'infinite_ammo',
    label: 'Infinite Ammo',
    shortLabel: 'INF',
    description: 'Unlimited shells without reload',
    color: '#f59e0b',
    accent: '#fde68a',
    timed: true,
  },
  shield: {
    type: 'shield',
    label: 'Armor Shield',
    shortLabel: 'SHD',
    description: 'Blocks all incoming projectile hits',
    color: '#22d3ee',
    accent: '#cffafe',
    timed: true,
  },
  rapid_fire: {
    type: 'rapid_fire',
    label: 'Rapid Fire',
    shortLabel: 'RPD',
    description: '2.4x faster cannon fire rate',
    color: '#fb923c',
    accent: '#fed7aa',
    timed: true,
  },
  double_damage: {
    type: 'double_damage',
    label: 'Double Damage',
    shortLabel: '2X',
    description: '200% shell impact damage',
    color: '#ef4444',
    accent: '#fecaca',
    timed: true,
  },
  health_restore: {
    type: 'health_restore',
    label: 'Repair Kit',
    shortLabel: 'HP+',
    description: 'Instantly restores 45 armor HP',
    color: '#10b981',
    accent: '#a7f3d0',
    timed: false,
  },
  extra_ammo: {
    type: 'extra_ammo',
    label: 'Ammo Crate',
    shortLabel: 'AMO',
    description: 'Instantly refills full shell rack',
    color: '#eab308',
    accent: '#fef08a',
    timed: false,
  },
};

export const ALL_POWERUP_TYPES: PowerUpType[] = [
  'speed',
  'infinite_ammo',
  'shield',
  'rapid_fire',
  'double_damage',
  'health_restore',
  'extra_ammo',
];

export interface TankSkinConfig {
  id: number;
  name: string;
  body: string;
  dark: string;
  highlight: string;
  trim: string;
}

export const TANK_SKINS: TankSkinConfig[] = [
  { id: 0, name: 'Vanguard Olive', body: '#5c7c48', dark: '#374c2a', highlight: '#85ab6c', trim: '#d97706' },
  { id: 1, name: 'Cobalt Striker', body: '#3b6ea5', dark: '#214166', highlight: '#659ad2', trim: '#38bdf8' },
  { id: 2, name: 'Crimson Viper', body: '#b83b3b', dark: '#732121', highlight: '#df6565', trim: '#fbbf24' },
  { id: 3, name: 'Desert Jackal', body: '#b89456', dark: '#735a30', highlight: '#dbb87c', trim: '#f59e0b' },
  { id: 4, name: 'Obsidian Recon', body: '#475569', dark: '#1e293b', highlight: '#7c8ea6', trim: '#22d3ee' },
  { id: 5, name: 'Tungsten Forge', body: '#78716c', dark: '#44403c', highlight: '#a8a29e', trim: '#fb923c' },
  { id: 6, name: 'Emerald Fang', body: '#2f856b', dark: '#184e3e', highlight: '#52b395', trim: '#a3e635' },
];
