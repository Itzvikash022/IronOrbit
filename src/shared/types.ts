export type GameMode = 'deathmatch' | 'ctf';
export type TeamId = 'red' | 'blue' | 'none';
export type MapId =
  | 'desert'
  | 'industrial'
  | 'forest'
  | 'frozen'
  | 'city'
  | 'outpost'
  | 'lava';

export type PowerUpType =
  | 'speed'
  | 'infinite_ammo'
  | 'shield'
  | 'rapid_fire'
  | 'double_damage'
  | 'health_restore'
  | 'extra_ammo';

export type GraphicsQuality = 'high' | 'medium';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type ObstacleKind =
  | 'rock'
  | 'ruin'
  | 'container'
  | 'machinery'
  | 'tree'
  | 'barrier'
  | 'ice_wall'
  | 'building'
  | 'wreck'
  | 'bunker'
  | 'lava_pillar'
  | 'sandbag';

export interface Obstacle extends Rect {
  id: string;
  kind: ObstacleKind;
  color?: string;
}

export interface BaseZone {
  x: number;
  y: number;
  radius: number;
}

export interface MapPalette {
  groundBase: string;
  groundDetail: string;
  groundAccent: string;
  gridLine: string;
  obstacleFill: string;
  obstacleStroke: string;
  obstacleTop: string;
  ambientEffect: 'dust' | 'sparks' | 'leaves' | 'snow' | 'ash' | 'none' | 'embers';
}

export interface ArenaMap {
  id: MapId;
  name: string;
  subtitle: string;
  width: number;
  height: number;
  palette: MapPalette;
  obstacles: Obstacle[];
  ffaSpawns: Vec2[];
  redSpawns: Vec2[];
  blueSpawns: Vec2[];
  redBase: BaseZone;
  blueBase: BaseZone;
  crateZones: Vec2[];
}

export interface GameSettings {
  tankRotationSpeed: number; // rad/s
  tankMoveSpeed: number; // px/s
  tankAcceleration: number; // px/s^2
  tankDeceleration: number; // px/s^2
  projectileSpeed: number; // px/s
  projectileDamage: number;
  projectileRange: number; // px
  fireCooldownMs: number;
  maxAmmo: number;
  ammoRegenTimeMs: number;
  respawnDelayMs: number;
  invincibilityDurationMs: number;
  powerUpDurationMs: number;
  crateSpawnIntervalMs: number;
  crateDespawnMs: number;
  maxActiveCrates: number;
  matchDurationSec: number;
  maxPlayersPerRoom: number;
  serverTickRate: number; // ticks/sec
}

export interface ClientPreferences {
  soundVolume: number; // 0..1
  muted: boolean;
  graphicsQuality: GraphicsQuality;
}

export interface ActivePowerUp {
  type: PowerUpType;
  expiresAt: number; // epoch ms
  durationMs: number;
}

export interface PlayerInputState {
  seq: number;
  thrust: boolean;
  aimAngle: number;
}

export interface TankEntity {
  id: string;
  nickname: string;
  team: TeamId;
  skinIndex: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number; // hull facing angle (auto-rotates)
  aimAngle: number; // turret aiming angle toward mouse
  hp: number;
  maxHp: number;
  ammo: number;
  maxAmmo: number;
  ammoRegenProgress: number; // 0..1
  lastShotAt: number;
  alive: boolean;
  respawnAt: number; // epoch ms if dead
  invincibleUntil: number; // epoch ms
  activePowerUps: ActivePowerUp[];
  kills: number;
  deaths: number;
  assists: number;
  captures: number;
  score: number;
  carryingFlag: TeamId; // 'none' | 'red' | 'blue'
  connected: boolean;
  lastProcessedSeq: number;
}

export interface ProjectileEntity {
  id: string;
  ownerId: string;
  team: TeamId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  distanceTraveled: number;
  maxRange: number;
  isDoubleDamage: boolean;
}

export interface SupplyCrateEntity {
  id: string;
  x: number;
  y: number;
  powerUp: PowerUpType;
  spawnedAt: number;
  expiresAt: number;
}

export interface FlagEntity {
  team: 'red' | 'blue';
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  state: 'at_base' | 'carried' | 'dropped';
  carrierId: string | null;
}

export interface LobbyPlayer {
  id: string;
  nickname: string;
  team: TeamId;
  skinIndex: number;
  isHost: boolean;
  connected: boolean;
}

export interface RoomInfo {
  code: string;
  hostId: string;
  mode: GameMode;
  mapId: MapId;
  status: 'lobby' | 'playing' | 'ended';
  players: LobbyPlayer[];
  settings: GameSettings;
}

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  team: TeamId;
  kills: number;
  deaths: number;
  assists: number;
  captures: number;
  score: number;
  rank: number;
}

export interface MatchSnapshot {
  serverTime: number;
  timeRemainingSec: number;
  mode: GameMode;
  mapId: MapId;
  tanks: TankEntity[];
  projectiles: ProjectileEntity[];
  crates: SupplyCrateEntity[];
  flags: {
    red: FlagEntity;
    blue: FlagEntity;
  };
  teamScores: {
    red: number;
    blue: number;
  };
  leaderboard: LeaderboardEntry[];
}

export interface MatchResult {
  mode: GameMode;
  mapId: MapId;
  durationSec: number;
  winnerId: string | null;
  winnerName: string;
  winningTeam: TeamId;
  teamScores: {
    red: number;
    blue: number;
  };
  leaderboard: LeaderboardEntry[];
  totalKills: number;
  totalDeaths: number;
}

export interface KillFeedEvent {
  id: string;
  killerId: string;
  killerName: string;
  victimId: string;
  victimName: string;
  killerTeam: TeamId;
  victimTeam: TeamId;
  timestamp: number;
}

export interface FlagBannerEvent {
  type: 'pickup' | 'drop' | 'return' | 'capture';
  flagTeam: 'red' | 'blue';
  actorName: string;
  actorTeam: TeamId;
  timestamp: number;
}
