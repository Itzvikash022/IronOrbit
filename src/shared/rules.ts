import {
  DOUBLE_DAMAGE_MULTIPLIER,
  FLAG_PICKUP_RADIUS,
  HEALTH_RESTORE_AMOUNT,
  POWERUP_META,
  RAPID_FIRE_MULTIPLIER,
  SCORING,
} from './config.ts';
import { distanceSq, hasPowerUp } from './physics.ts';
import type {
  BaseZone,
  FlagEntity,
  GameMode,
  GameSettings,
  LeaderboardEntry,
  LobbyPlayer,
  PowerUpType,
  TankEntity,
  TeamId,
} from './types.ts';

export function canTankFire(
  tank: Pick<TankEntity, 'alive' | 'ammo' | 'lastShotAt' | 'activePowerUps'>,
  nowMs: number,
  settings: GameSettings
): boolean {
  if (!tank.alive) return false;
  const infAmmo = hasPowerUp(tank, 'infinite_ammo', nowMs);
  if (!infAmmo && tank.ammo <= 0) return false;

  const cooldown = hasPowerUp(tank, 'rapid_fire', nowMs)
    ? settings.fireCooldownMs * RAPID_FIRE_MULTIPLIER
    : settings.fireCooldownMs;

  return nowMs - tank.lastShotAt >= cooldown;
}

export function consumeAmmo(
  tank: Pick<TankEntity, 'ammo' | 'ammoRegenProgress' | 'activePowerUps'>,
  nowMs: number
): void {
  if (hasPowerUp(tank, 'infinite_ammo', nowMs)) return;
  if (tank.ammo > 0) {
    tank.ammo -= 1;
  }
}

export function tickAmmoRegen(
  tank: Pick<TankEntity, 'alive' | 'ammo' | 'maxAmmo' | 'ammoRegenProgress'>,
  dt: number,
  settings: GameSettings
): boolean {
  if (!tank.alive) return false;
  if (tank.ammo >= tank.maxAmmo) {
    tank.ammoRegenProgress = 0;
    return false;
  }

  const ratePerSec = 1000 / Math.max(200, settings.ammoRegenTimeMs);
  tank.ammoRegenProgress += ratePerSec * dt;

  if (tank.ammoRegenProgress >= 1) {
    tank.ammo = Math.min(tank.maxAmmo, tank.ammo + 1);
    tank.ammoRegenProgress = tank.ammo >= tank.maxAmmo ? 0 : tank.ammoRegenProgress - 1;
    return true;
  }
  return false;
}

export interface DamageResult {
  appliedDamage: number;
  blockedReason: 'none' | 'self' | 'friendly' | 'invincible' | 'shield' | 'dead';
  eliminated: boolean;
}

export function applyTankDamage(
  victim: TankEntity,
  attackerId: string,
  attackerTeam: TeamId,
  baseDamage: number,
  isDoubleDamage: boolean,
  mode: GameMode,
  nowMs: number
): DamageResult {
  if (!victim.alive) {
    return { appliedDamage: 0, blockedReason: 'dead', eliminated: false };
  }
  if (victim.id === attackerId) {
    return { appliedDamage: 0, blockedReason: 'self', eliminated: false };
  }
  if (mode === 'ctf' && attackerTeam !== 'none' && victim.team === attackerTeam) {
    return { appliedDamage: 0, blockedReason: 'friendly', eliminated: false };
  }
  if (victim.invincibleUntil > nowMs) {
    return { appliedDamage: 0, blockedReason: 'invincible', eliminated: false };
  }
  if (hasPowerUp(victim, 'shield', nowMs)) {
    return { appliedDamage: 0, blockedReason: 'shield', eliminated: false };
  }

  const dmg = isDoubleDamage
    ? Math.round(baseDamage * DOUBLE_DAMAGE_MULTIPLIER)
    : Math.round(baseDamage);

  victim.hp = Math.max(0, victim.hp - dmg);
  const eliminated = victim.hp <= 0;
  if (eliminated) {
    victim.alive = false;
  }

  return {
    appliedDamage: dmg,
    blockedReason: 'none',
    eliminated,
  };
}

export function activatePowerUp(
  tank: TankEntity,
  type: PowerUpType,
  nowMs: number,
  settings: GameSettings
): void {
  const meta = POWERUP_META[type];

  if (type === 'health_restore') {
    tank.hp = Math.min(tank.maxHp, tank.hp + HEALTH_RESTORE_AMOUNT);
    return;
  }

  if (type === 'extra_ammo') {
    tank.ammo = tank.maxAmmo;
    tank.ammoRegenProgress = 0;
    return;
  }

  if (meta.timed) {
    // Non-stacking: replace existing timer of same type with fresh duration
    const existingIdx = tank.activePowerUps.findIndex((p) => p.type === type);
    const entry = {
      type,
      expiresAt: nowMs + settings.powerUpDurationMs,
      durationMs: settings.powerUpDurationMs,
    };
    if (existingIdx >= 0) {
      tank.activePowerUps[existingIdx] = entry;
    } else {
      tank.activePowerUps.push(entry);
    }
  }
}

export function pruneExpiredPowerUps(tank: TankEntity, nowMs: number): void {
  if (tank.activePowerUps.length === 0) return;
  tank.activePowerUps = tank.activePowerUps.filter((p) => p.expiresAt > nowMs);
}

export function buildLeaderboard(tanks: TankEntity[]): LeaderboardEntry[] {
  const sorted = [...tanks].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.kills !== a.kills) return b.kills - a.kills;
    if (a.deaths !== b.deaths) return a.deaths - b.deaths;
    return a.nickname.localeCompare(b.nickname);
  });

  return sorted.map((t, index) => ({
    id: t.id,
    nickname: t.nickname,
    team: t.team,
    kills: t.kills,
    deaths: t.deaths,
    assists: t.assists,
    captures: t.captures,
    score: t.score,
    rank: index + 1,
  }));
}

export function assignBalancedTeam(players: Pick<LobbyPlayer, 'team'>[]): 'red' | 'blue' {
  let redCount = 0;
  let blueCount = 0;
  for (const p of players) {
    if (p.team === 'red') redCount++;
    else if (p.team === 'blue') blueCount++;
  }
  return redCount <= blueCount ? 'red' : 'blue';
}

export type FlagInteractionResult =
  | { event: 'none' }
  | { event: 'pickup'; flagTeam: 'red' | 'blue' }
  | { event: 'return'; flagTeam: 'red' | 'blue' }
  | { event: 'capture'; flagTeam: 'red' | 'blue'; scoringTeam: 'red' | 'blue' };

export function evaluateFlagInteraction(
  tank: TankEntity,
  flags: { red: FlagEntity; blue: FlagEntity },
  bases: { red: BaseZone; blue: BaseZone }
): FlagInteractionResult {
  if (!tank.alive || (tank.team !== 'red' && tank.team !== 'blue')) {
    return { event: 'none' };
  }

  const ownTeam = tank.team;
  const enemyTeam = ownTeam === 'red' ? 'blue' : 'red';
  const ownFlag = flags[ownTeam];
  const enemyFlag = flags[enemyTeam];
  const ownBase = bases[ownTeam];

  // 1. Check if defending player touches their own dropped flag -> return it home
  if (
    ownFlag.state === 'dropped' &&
    distanceSq(tank.x, tank.y, ownFlag.x, ownFlag.y) <= FLAG_PICKUP_RADIUS * FLAG_PICKUP_RADIUS
  ) {
    ownFlag.state = 'at_base';
    ownFlag.x = ownFlag.homeX;
    ownFlag.y = ownFlag.homeY;
    ownFlag.carrierId = null;
    return { event: 'return', flagTeam: ownTeam };
  }

  // 2. Check if player carrying enemy flag enters their own capture zone while own flag is safely at base
  if (
    tank.carryingFlag === enemyTeam &&
    ownFlag.state === 'at_base' &&
    distanceSq(tank.x, tank.y, ownBase.x, ownBase.y) <= ownBase.radius * ownBase.radius
  ) {
    tank.carryingFlag = 'none';
    tank.captures += 1;
    tank.score += SCORING.FLAG_CAPTURE;
    enemyFlag.state = 'at_base';
    enemyFlag.x = enemyFlag.homeX;
    enemyFlag.y = enemyFlag.homeY;
    enemyFlag.carrierId = null;
    return { event: 'capture', flagTeam: enemyTeam, scoringTeam: ownTeam };
  }

  // 3. Check if player picks up enemy flag (at_base or dropped)
  if (
    tank.carryingFlag === 'none' &&
    enemyFlag.state !== 'carried' &&
    distanceSq(tank.x, tank.y, enemyFlag.x, enemyFlag.y) <=
      FLAG_PICKUP_RADIUS * FLAG_PICKUP_RADIUS
  ) {
    enemyFlag.state = 'carried';
    enemyFlag.carrierId = tank.id;
    enemyFlag.x = tank.x;
    enemyFlag.y = tank.y;
    tank.carryingFlag = enemyTeam;
    return { event: 'pickup', flagTeam: enemyTeam };
  }

  return { event: 'none' };
}

export function checkMilestoneReached(
  mode: GameMode,
  settings: Pick<GameSettings, 'dmWinMode' | 'killTarget' | 'ctfWinMode' | 'flagTarget'>,
  tanks: Pick<TankEntity, 'kills'>[],
  teamScores: { red: number; blue: number }
): boolean {
  if (mode === 'deathmatch') {
    if (settings.dmWinMode !== 'milestone' || settings.killTarget <= 0) return false;
    return tanks.some((t) => t.kills >= settings.killTarget);
  }
  if (settings.ctfWinMode !== 'milestone' || settings.flagTarget <= 0) return false;
  return teamScores.red >= settings.flagTarget || teamScores.blue >= settings.flagTarget;
}

