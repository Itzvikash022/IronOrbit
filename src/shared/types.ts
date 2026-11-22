export type GameMode = 'deathmatch' | 'tdm' | 'ctf';
export type TeamId = 'red' | 'blue' | 'none';

/** Modes that use red/blue teams, team spawns, and no friendly fire. */
export function isTeamMode(mode: GameMode): boolean {
  return mode === 'ctf' || mode === 'tdm';
}

export function gameModeLabel(mode: GameMode): string {
  if (mode === 'ctf') return 'Capture the Flag';
  if (mode === 'tdm') return 'Team Deathmatch';
  return 'Deathmatch';
}
export type ClassicMapId =
  | 'desert'
  | 'industrial'
  | 'forest'
  | 'frozen'
  | 'city'
  | 'outpost'
  | 'lava';

export type BetaMapId =
  | 'dunes'
  | 'glacier'
  | 'magma'
  | 'storm'
  | 'sentinel'
  | 'overgrowth'
  | 'blastyard';

export type MapId = ClassicMapId | BetaMapId;

export type MapCategory = 'classic' | 'terrain' | 'obstacle';

export type PowerUpType =
  | 'speed'
  | 'infinite_ammo'
  | 'shield'
  | 'rapid_fire'
  | 'double_damage'
  | 'health_restore'
  | 'extra_ammo'
  /** Terrain-map charge pickup; 3 charges trigger that map's team ultimate. */
  | 'terrain_boost';

export type TerrainUltKind = 'slow' | 'freeze' | 'burn' | 'gust_shield';

export type GraphicsQuality = 'high' | 'medium';

export type BotDifficulty = 'noob' | 'player' | 'pro';

export const BOT_DIFFICULTIES: BotDifficulty[] = ['noob', 'player', 'pro'];

export function botDifficultyLabel(d: BotDifficulty): string {
  if (d === 'noob') return 'Noob';
  if (d === 'pro') return 'Pro';
  return 'Player';
}

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

export type SurfaceKind = 'none' | 'sand' | 'ice' | 'lava';
export type HazardKind = 'sand' | 'ice' | 'lava' | 'grass';

/** Elliptical floor hazard generated deterministically from (map, matchSeed). */
export interface HazardZone {
  id: string;
  kind: HazardKind;
  x: number; // center
  y: number;
  rx: number;
  ry: number;
}

export interface SurfaceZoneSpec {
  kind: HazardKind;
  count: [number, number]; // min..max zones per match
  rx: [number, number];
  ry: [number, number];
}

/** Per-map description of which mechanics are active (and how many). */
export interface HazardSpec {
  surfaces?: SurfaceZoneSpec[];
  wind?: boolean;
  turrets?: [number, number]; // min..max wall turrets
  bombs?: boolean;
  /** Terrain maps: 3× terrain_boost pickups trigger this team ultimate. */
  terrainUlt?: TerrainUltKind;
}

/** Active match-wide terrain ultimate (server authority). */
export interface TerrainUltState {
  kind: TerrainUltKind;
  ownerId: string;
  ownerTeam: TeamId;
  expiresAt: number;
}

export interface TurretEntity {
  id: string;
  x: number;
  y: number;
  angle: number;
  /** Home side; only hostile to the opposite team in CTF, neutral in TDM/FFA. */
  team: 'red' | 'blue';
  /** 0..1 reload charge for the barrel glow telegraph. */
  charge: number;
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
  category?: MapCategory;
  beta?: boolean;
  hazardSpec?: HazardSpec;
  /** When true, floor art is a full-arena image (`floor_${id}`) and obstacles are collision-only. */
  bakedFloor?: boolean;
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
  dmWinMode: 'milestone' | 'timed';
  killTarget: number;
  ctfWinMode: 'milestone' | 'timed';
  flagTarget: number;
}

/** Primary drive/fire/flip control. Keyboard uses KeyboardEvent.code; mouse uses button index. */
export type ActionBind =
  | { device: 'keyboard'; code: string }
  | { device: 'mouse'; button: number };

export interface ClientPreferences {
  soundVolume: number; // 0..1
  muted: boolean;
  graphicsQuality: GraphicsQuality;
  /** Tap = fire + flip; hold = drive only. Default Space. */
  actionBind: ActionBind;
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
  rotationDir: 1 | -1; // 1 = clockwise, -1 = counter-clockwise
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
  isBot?: boolean;
  /** Epoch ms until which the tank is stunned (can't drive or shoot). */
  stunnedUntil?: number;
  /** 0..2 terrain boost charges; the 3rd pickup fires the map ultimate and resets to 0. */
  terrainCharges?: number;
  /** Epoch ms until which movement is slowed (dunes ultimate). */
  slowedUntil?: number;
  /** Epoch ms until which this tank ignores projectile hits (storm ultimate). */
  gustShieldUntil?: number;
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
  /** Set once wind has noticeably deflected this shell (enables reduced self-hit). */
  windBent?: boolean;
  /** Accumulated sideways wind push (px/s); drives windBent. */
  windBendAcc?: number;
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
  isBot?: boolean;
}

export interface RoomInfo {
  code: string;
  hostId: string;
  mode: GameMode;
  mapId: MapId;
  status: 'lobby' | 'playing' | 'ended';
  players: LobbyPlayer[];
  settings: GameSettings;
  /** Shared difficulty for all bots in the room (0–3 bots). */
  botDifficulty: BotDifficulty;
  /** When true, Randomize / Play Again may pick beta maps. */
  includeBetaMaps: boolean;
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
  /** Seed shared by client+server to rebuild hazards, wind gusts and bomb schedule. */
  matchSeed: number;
  /** Server epoch ms at match start (elapsed = serverTime - matchStartTime). */
  matchStartTime: number;
  turrets: TurretEntity[];
  /** Active terrain ultimate, if any. */
  terrainUlt: TerrainUltState | null;
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
  dmWinMode: 'milestone' | 'timed';
  killTarget: number;
  ctfWinMode: 'milestone' | 'timed';
  flagTarget: number;
  leaderboard: LeaderboardEntry[];
}

export interface MatchResult {
  mode: GameMode;
  mapId: MapId;
  durationSec: number;
  endReason: 'milestone' | 'timer';
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
