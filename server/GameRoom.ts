import { Server } from 'socket.io';
import {
  DEFAULT_GAME_SETTINGS,
  RECONNECT_GRACE_MS,
  sanitizeGameSettings,
  TANK_SKINS,
} from '../src/shared/config.ts';
import { ARENA_MAPS, getRandomMapId } from '../src/shared/maps.ts';
import {
  hasPowerUp,
  registerFireClick,
  type RotationFlipState,
  selectSafeSpawn,
  stepRotationFlip,
  stepTankMotion,
} from '../src/shared/physics.ts';
import {
  buildLeaderboard,
  checkMilestoneReached,
  tickAmmoRegen,
} from '../src/shared/rules.ts';
import type {
  BotDifficulty,
  FlagBannerEvent,
  FlagEntity,
  GameMode,
  GameSettings,
  KillFeedEvent,
  LobbyPlayer,
  MapId,
  MatchResult,
  MatchSnapshot,
  PlayerInputState,
  ProjectileEntity,
  RoomInfo,
  SupplyCrateEntity,
  TankEntity,
  TeamId,
} from '../src/shared/types.ts';
import { isTeamMode } from '../src/shared/types.ts';
import { decideBotAction } from './BotAI.ts';
import type { CombatEventCallbacks } from './CombatSystem.ts';
import { CombatSystem } from './CombatSystem.ts';
import { createGameModeHandler } from './GameModeManager.ts';
import type { GameModeHandler } from './GameModeManager.ts';
import { PowerUpManager } from './PowerUpManager.ts';

export const MAX_BOTS = 3;
export const CTF_BOTS_JOIN_BLOCK =
  'This Capture the Flag room has bots. Ask the host to switch to FFA/Team DM or remove the bots before you can join.';

interface PlayerSession {
  playerId: string; // persistent client token
  socketId: string;
  nickname: string;
  team: TeamId;
  skinIndex: number;
  connected: boolean;
  disconnectedAt: number;
  input: PlayerInputState;
  pendingShots: number;
  flipState: RotationFlipState;
  isBot: boolean;
}

export class GameRoom {
  readonly code: string;
  private io: Server;
  hostId: string;
  mode: GameMode = 'deathmatch';
  mapId: MapId;
  status: 'lobby' | 'playing' | 'ended' = 'lobby';
  settings: GameSettings;

  private sessions = new Map<string, PlayerSession>(); // keyed by playerId
  private socketToPlayer = new Map<string, string>();

  private modeHandler: GameModeHandler;
  private combat = new CombatSystem();
  private powerUps = new PowerUpManager();

  private tanks: TankEntity[] = [];
  private projectiles: ProjectileEntity[] = [];
  private crates: SupplyCrateEntity[] = [];
  private flags!: { red: FlagEntity; blue: FlagEntity };
  private teamScores = { red: 0, blue: 0 };

  private matchStartTime = 0;
  private lastTickTime = 0;
  private tickTimer: NodeJS.Timeout | null = null;
  private killCounter = 0;
  private lastMatchResult: MatchResult | null = null;
  private onEmptyCallback: (code: string) => void;
  private botDifficulty: BotDifficulty = 'player';
  private botSeq = 0;

  constructor(
    code: string,
    hostPlayerId: string,
    hostSocketId: string,
    hostNickname: string,
    io: Server,
    onEmpty: (code: string) => void,
    initialSettings?: Partial<GameSettings>
  ) {
    this.code = code;
    this.io = io;
    this.hostId = hostPlayerId;
    this.mapId = getRandomMapId();
    this.settings = sanitizeGameSettings(initialSettings, DEFAULT_GAME_SETTINGS);
    this.modeHandler = createGameModeHandler(this.mode);
    this.onEmptyCallback = onEmpty;

    this.addSession(hostPlayerId, hostSocketId, hostNickname);
  }

  get playerCount(): number {
    return this.sessions.size;
  }

  humanCount(): number {
    let n = 0;
    for (const s of this.sessions.values()) {
      if (!s.isBot) n += 1;
    }
    return n;
  }

  botCount(): number {
    let n = 0;
    for (const s of this.sessions.values()) {
      if (s.isBot) n += 1;
    }
    return n;
  }

  /** Bots allowed in FFA/TDM always; CTF only while the room is solo (1 human). */
  botsAllowedInCurrentMode(humanOverride?: number): boolean {
    if (this.mode !== 'ctf') return true;
    return (humanOverride ?? this.humanCount()) <= 1;
  }

  hasNickname(nickname: string, excludePlayerId?: string): boolean {
    const normalized = nickname.trim().toLowerCase();
    for (const session of this.sessions.values()) {
      if (excludePlayerId && session.playerId === excludePlayerId) continue;
      if (session.nickname.toLowerCase() === normalized) return true;
    }
    return false;
  }

  hasPlayer(playerId: string): boolean {
    return this.sessions.has(playerId);
  }

  joinPlayer(
    playerId: string,
    socketId: string,
    nickname: string
  ):
    | { ok: true; reconnected: boolean; previousSocketId?: string }
    | { ok: false; error: string } {
    const existing = this.sessions.get(playerId);
    if (existing) {
      if (existing.isBot) {
        return { ok: false, error: 'That player id belongs to a bot.' };
      }
      const previousSocketId = existing.socketId;
      const wasDisconnected = !existing.connected;
      if (previousSocketId && previousSocketId !== socketId) {
        this.socketToPlayer.delete(previousSocketId);
      }
      existing.socketId = socketId;
      existing.connected = true;
      existing.disconnectedAt = 0;
      existing.input.thrust = false;
      existing.pendingShots = 0;
      existing.flipState = { pendingClicks: 0, lastClickAt: 0 };
      if (nickname.trim()) {
        const clean = nickname.trim().slice(0, 18);
        if (!this.hasNickname(clean, playerId)) {
          existing.nickname = clean;
        }
      }
      this.socketToPlayer.set(socketId, playerId);

      if (this.status === 'playing') {
        let tank = this.tanks.find((t) => t.id === playerId);
        if (!tank) {
          tank = this.createTankForSession(existing, Date.now());
          this.tanks.push(tank);
        } else {
          tank.connected = true;
          tank.nickname = existing.nickname;
        }
      }

      if (wasDisconnected) {
        this.io.to(this.code).emit('player:reconnected', {
          playerId,
          nickname: existing.nickname,
        });
      }

      this.broadcastRoomInfo();
      return { ok: true, reconnected: true, previousSocketId };
    }

    if (this.sessions.size >= this.settings.maxPlayersPerRoom) {
      return { ok: false, error: 'Room is full.' };
    }

    // CTF + bots is solo-only: joining would make 2+ humans
    if (this.mode === 'ctf' && this.botCount() > 0 && this.humanCount() >= 1) {
      return { ok: false, error: CTF_BOTS_JOIN_BLOCK };
    }

    const cleanNick = nickname.trim().slice(0, 18);
    if (!cleanNick) {
      return { ok: false, error: 'Nickname is required.' };
    }
    if (this.hasNickname(cleanNick)) {
      return { ok: false, error: 'That nickname is already active in this room.' };
    }

    const session = this.addSession(playerId, socketId, cleanNick);

    // If match is already in progress, spawn tank into the live arena
    if (this.status === 'playing') {
      const tank = this.createTankForSession(session, Date.now());
      this.tanks.push(tank);
    }

    this.broadcastRoomInfo();
    return { ok: true, reconnected: false };
  }

  private addSession(
    playerId: string,
    socketId: string,
    nickname: string,
    isBot = false
  ): PlayerSession {
    const usedSkins = new Set(Array.from(this.sessions.values()).map((s) => s.skinIndex));
    let skinIndex = this.sessions.size % TANK_SKINS.length;
    for (let i = 0; i < TANK_SKINS.length; i++) {
      if (!usedSkins.has(i)) {
        skinIndex = i;
        break;
      }
    }

    const team: TeamId = isTeamMode(this.mode)
      ? this.modeHandler.assignTeam(
          Array.from(this.sessions.values()).map((s) => ({ team: s.team }) as TankEntity)
        )
      : 'none';

    const session: PlayerSession = {
      playerId,
      socketId,
      nickname: nickname.trim().slice(0, 18),
      team,
      skinIndex,
      connected: true,
      disconnectedAt: 0,
      input: { seq: 0, thrust: false, aimAngle: 0 },
      pendingShots: 0,
      flipState: { pendingClicks: 0, lastClickAt: 0 },
      isBot,
    };
    this.sessions.set(playerId, session);
    this.socketToPlayer.set(socketId, playerId);
    return session;
  }

  setBots(
    requesterId: string,
    count: number,
    difficulty?: BotDifficulty
  ): { ok: true } | { ok: false; error: string } {
    if (requesterId !== this.hostId) {
      return { ok: false, error: 'Only the host can manage bots.' };
    }
    if (this.status !== 'lobby') {
      return { ok: false, error: 'Bots can only be changed in the lobby.' };
    }

    const target = Math.max(0, Math.min(MAX_BOTS, Math.round(Number(count) || 0)));
    if (difficulty === 'noob' || difficulty === 'player' || difficulty === 'pro') {
      this.botDifficulty = difficulty;
    }

    if (target > 0 && !this.botsAllowedInCurrentMode()) {
      return {
        ok: false,
        error:
          'Bots in Capture the Flag are only allowed in solo rooms. Switch to FFA/Team DM, or play CTF alone with bots.',
      };
    }

    const current = this.botCount();
    if (target > current) {
      for (let i = current; i < target; i++) {
        if (this.sessions.size >= this.settings.maxPlayersPerRoom) break;
        this.botSeq += 1;
        const id = `bot_${this.code}_${this.botSeq}`;
        const nick = `Bot ${this.botSeq}`;
        this.addSession(id, `bot-socket:${id}`, nick, true);
      }
    } else if (target < current) {
      const bots = Array.from(this.sessions.values()).filter((s) => s.isBot);
      const removeN = current - target;
      for (let i = 0; i < removeN; i++) {
        const bot = bots[bots.length - 1 - i];
        if (bot) this.removePlayer(bot.playerId, 'left');
      }
    }

    this.broadcastRoomInfo();
    return { ok: true };
  }

  handleDisconnect(socketId: string): void {
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return;
    this.socketToPlayer.delete(socketId);
    const session = this.sessions.get(playerId);
    if (!session || session.socketId !== socketId) return;

    session.connected = false;
    session.disconnectedAt = Date.now();
    session.input.thrust = false;
    session.pendingShots = 0;
    session.flipState = { pendingClicks: 0, lastClickAt: 0 };

    const tank = this.tanks.find((t) => t.id === playerId);
    if (tank) {
      tank.connected = false;
      tank.vx = 0;
      tank.vy = 0;
      // Drop flag immediately if carrier disconnects
      if (
        this.status === 'playing' &&
        (tank.carryingFlag === 'red' || tank.carryingFlag === 'blue')
      ) {
        const carriedTeam: 'red' | 'blue' = tank.carryingFlag;
        const flag = this.flags[carriedTeam];
        flag.state = 'dropped';
        flag.x = tank.x;
        flag.y = tank.y;
        flag.carrierId = null;
        tank.carryingFlag = 'none';
      }
    }

    this.io.to(this.code).emit('player:disconnected', {
      playerId,
      nickname: session.nickname,
      temporary: true,
    });
    this.broadcastRoomInfo();
  }

  removePlayer(playerId: string, reason: 'left' | 'timeout'): void {
    const session = this.sessions.get(playerId);
    if (!session) return;

    this.socketToPlayer.delete(session.socketId);
    this.sessions.delete(playerId);

    const tank = this.tanks.find((t) => t.id === playerId);
    if (
      tank &&
      this.status === 'playing' &&
      (tank.carryingFlag === 'red' || tank.carryingFlag === 'blue')
    ) {
      const carriedTeam: 'red' | 'blue' = tank.carryingFlag;
      const flag = this.flags[carriedTeam];
      flag.state = 'dropped';
      flag.x = tank.x;
      flag.y = tank.y;
      flag.carrierId = null;
    }
    this.tanks = this.tanks.filter((t) => t.id !== playerId);

    // Drop leftover bots when the last human leaves
    if (this.humanCount() === 0) {
      const botIds = Array.from(this.sessions.values())
        .filter((s) => s.isBot)
        .map((s) => s.playerId);
      for (const id of botIds) {
        this.socketToPlayer.delete(this.sessions.get(id)?.socketId ?? '');
        this.sessions.delete(id);
        this.tanks = this.tanks.filter((t) => t.id !== id);
      }
      this.stopLoop();
      this.onEmptyCallback(this.code);
      return;
    }

    // Reassign host if needed (humans only)
    if (this.hostId === playerId) {
      const nextHost =
        Array.from(this.sessions.values()).find((s) => s.connected && !s.isBot) ??
        Array.from(this.sessions.values()).find((s) => !s.isBot);
      if (nextHost) {
        this.hostId = nextHost.playerId;
      }
    }

    this.io.to(this.code).emit('player:disconnected', {
      playerId,
      nickname: session.nickname,
      temporary: false,
      reason,
    });
    this.broadcastRoomInfo();
  }

  updateLobbyConfig(
    requesterId: string,
    payload: {
      mode?: GameMode;
      mapId?: MapId;
      rerollMap?: boolean;
      settings?: Partial<GameSettings>;
    }
  ): void {
    if (requesterId !== this.hostId) return;

    if (payload.mode && payload.mode !== this.mode) {
      const nextMode = payload.mode;
      // CTF with bots requires solo — strip bots when 2+ humans switch into CTF
      if (nextMode === 'ctf' && this.botCount() > 0 && this.humanCount() >= 2) {
        const bots = Array.from(this.sessions.values()).filter((s) => s.isBot);
        for (const bot of bots) {
          this.removePlayer(bot.playerId, 'left');
        }
      }

      this.mode = nextMode;
      this.modeHandler = createGameModeHandler(this.mode);

      // Mode-specific kill-target defaults (host can still edit afterward)
      if (nextMode === 'tdm') {
        this.settings = sanitizeGameSettings({ killTarget: 40 }, this.settings);
      } else if (nextMode === 'deathmatch') {
        this.settings = sanitizeGameSettings({ killTarget: 10 }, this.settings);
      }

      if (!isTeamMode(this.mode)) {
        for (const s of this.sessions.values()) s.team = 'none';
      } else {
        const list = Array.from(this.sessions.values());
        list.forEach((s, idx) => {
          s.team = idx % 2 === 0 ? 'red' : 'blue';
        });
      }
    }

    if (payload.rerollMap) {
      this.mapId = getRandomMapId(this.mapId);
    } else if (payload.mapId && ARENA_MAPS[payload.mapId]) {
      this.mapId = payload.mapId;
    }

    if (payload.settings) {
      this.settings = sanitizeGameSettings(payload.settings, this.settings);
    }

    this.broadcastRoomInfo();
  }

  switchTeam(playerId: string, team: 'red' | 'blue'): void {
    if (!isTeamMode(this.mode) || this.status !== 'lobby') return;
    const session = this.sessions.get(playerId);
    if (!session) return;
    session.team = team;
    this.broadcastRoomInfo();
  }

  startMatch(requesterId: string, randomizeMap = false): void {
    if (requesterId !== this.hostId) return;
    if (randomizeMap) {
      this.mapId = getRandomMapId();
    }

    const nowMs = Date.now();
    const map = ARENA_MAPS[this.mapId];
    this.status = 'playing';
    this.lastMatchResult = null;
    this.matchStartTime = nowMs;
    this.lastTickTime = nowMs;
    this.projectiles = [];
    this.crates = [];
    this.teamScores = { red: 0, blue: 0 };
    this.combat.reset();
    this.powerUps.reset(nowMs);

    this.flags = {
      red: {
        team: 'red',
        x: map.redBase.x,
        y: map.redBase.y,
        homeX: map.redBase.x,
        homeY: map.redBase.y,
        state: 'at_base',
        carrierId: null,
      },
      blue: {
        team: 'blue',
        x: map.blueBase.x,
        y: map.blueBase.y,
        homeX: map.blueBase.x,
        homeY: map.blueBase.y,
        state: 'at_base',
        carrierId: null,
      },
    };

    // Ensure balanced teams in CTF / Team Deathmatch
    if (isTeamMode(this.mode)) {
      const list = Array.from(this.sessions.values());
      const needsAssign = list.some((s) => s.team !== 'red' && s.team !== 'blue');
      if (needsAssign) {
        list.forEach((s, idx) => {
          s.team = idx % 2 === 0 ? 'red' : 'blue';
        });
      }
    } else {
      for (const s of this.sessions.values()) {
        s.team = 'none';
      }
    }

    this.tanks = [];
    for (const session of this.sessions.values()) {
      session.pendingShots = 0;
      session.flipState = { pendingClicks: 0, lastClickAt: 0 };
      this.tanks.push(this.createTankForSession(session, nowMs));
    }

    this.broadcastRoomInfo();
    this.io.to(this.code).emit('match:started', {
      room: this.getRoomInfo(),
      snapshot: this.buildSnapshot(nowMs),
    });

    this.startLoop();
  }

  returnToLobby(requesterId: string): void {
    if (requesterId !== this.hostId) return;
    this.stopLoop();
    this.status = 'lobby';
    this.lastMatchResult = null;
    this.projectiles = [];
    this.crates = [];
    this.tanks = [];
    this.mapId = getRandomMapId();
    this.broadcastRoomInfo();
    this.io.to(this.code).emit('room:returnedToLobby', this.getRoomInfo());
  }

  handleInput(socketId: string, input: PlayerInputState): void {
    if (this.status !== 'playing') return;
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return;
    const session = this.sessions.get(playerId);
    if (!session) return;

    session.input = {
      seq: input.seq,
      thrust: Boolean(input.thrust),
      aimAngle: Number.isFinite(input.aimAngle) ? input.aimAngle : session.input.aimAngle,
    };
  }

  handleShoot(socketId: string, _aimAngle?: number): void {
    if (this.status !== 'playing') return;
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return;
    const session = this.sessions.get(playerId);
    if (!session) return;
    const tank = this.tanks.find((t) => t.id === playerId);
    if (tank?.alive) {
      // Each action-key press flips spin (parity) even at 0 ammo / on cooldown
      registerFireClick(session.flipState, Date.now());
    }
    if (session.pendingShots < 3) {
      session.pendingShots += 1;
    }
  }

  getRoomInfo(): RoomInfo {
    const players: LobbyPlayer[] = Array.from(this.sessions.values()).map((s) => ({
      id: s.playerId,
      nickname: s.nickname,
      team: s.team,
      skinIndex: s.skinIndex,
      isHost: s.playerId === this.hostId,
      connected: s.connected,
      isBot: s.isBot || undefined,
    }));

    return {
      code: this.code,
      hostId: this.hostId,
      mode: this.mode,
      mapId: this.mapId,
      status: this.status,
      players,
      settings: this.settings,
      botDifficulty: this.botDifficulty,
    };
  }

  getCurrentSnapshot(): MatchSnapshot | null {
    if (this.status !== 'playing') return null;
    return this.buildSnapshot(Date.now());
  }

  getLastMatchResult(): MatchResult | null {
    return this.status === 'ended' ? this.lastMatchResult : null;
  }

  private broadcastRoomInfo(): void {
    this.io.to(this.code).emit('room:updated', this.getRoomInfo());
  }

  private createTankForSession(session: PlayerSession, nowMs: number): TankEntity {
    const map = ARENA_MAPS[this.mapId];
    const spawns = isTeamMode(this.mode)
      ? session.team === 'red'
        ? map.redSpawns
        : map.blueSpawns
      : map.ffaSpawns;

    const enemies = this.tanks.filter((t) => {
      if (isTeamMode(this.mode) && t.team === session.team) return false;
      return true;
    });
    const pos = selectSafeSpawn(spawns, enemies, map.obstacles);

    const spawnAngle = Math.random() * Math.PI * 2 - Math.PI;

    return {
      id: session.playerId,
      nickname: session.nickname,
      team: session.team,
      skinIndex: session.skinIndex,
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      angle: spawnAngle,
      aimAngle: spawnAngle,
      rotationDir: 1,
      hp: 100,
      maxHp: 100,
      ammo: this.settings.maxAmmo,
      maxAmmo: this.settings.maxAmmo,
      ammoRegenProgress: 0,
      lastShotAt: 0,
      alive: true,
      respawnAt: 0,
      invincibleUntil: nowMs + this.settings.invincibilityDurationMs,
      activePowerUps: [],
      kills: 0,
      deaths: 0,
      assists: 0,
      captures: 0,
      score: 0,
      carryingFlag: 'none',
      connected: session.connected,
      lastProcessedSeq: 0,
      isBot: session.isBot || undefined,
    };
  }

  private startLoop(): void {
    this.stopLoop();
    const tickMs = Math.max(25, Math.round(1000 / this.settings.serverTickRate));
    this.tickTimer = setInterval(() => this.stepTick(), tickMs);
  }

  stopLoop(): void {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  cleanupDisconnected(nowMs: number): void {
    const toRemove: string[] = [];
    for (const session of this.sessions.values()) {
      if (session.isBot) continue;
      if (!session.connected && nowMs - session.disconnectedAt >= RECONNECT_GRACE_MS) {
        toRemove.push(session.playerId);
      }
    }
    for (const id of toRemove) {
      this.removePlayer(id, 'timeout');
    }
  }

  private runBotControllers(nowMs: number): void {
    for (const session of this.sessions.values()) {
      if (!session.isBot || !session.connected) continue;
      const tank = this.tanks.find((t) => t.id === session.playerId);
      if (!tank || !tank.alive) {
        session.input.thrust = false;
        continue;
      }

      const decision = decideBotAction(
        tank,
        this.tanks,
        this.mode,
        this.botDifficulty
      );
      session.input = {
        seq: session.input.seq + 1,
        thrust: decision.thrust,
        aimAngle: tank.angle,
      };
      if (decision.wantFlip) {
        registerFireClick(session.flipState, nowMs);
      }
      if (decision.wantShoot && session.pendingShots < 1) {
        session.pendingShots += 1;
      }
    }
  }

  private stepTick(): void {
    const nowMs = Date.now();
    const rawDt = (nowMs - this.lastTickTime) / 1000;
    this.lastTickTime = nowMs;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.1);

    this.cleanupDisconnected(nowMs);
    if (this.status !== 'playing') return;

    this.runBotControllers(nowMs);

    const map = ARENA_MAPS[this.mapId];
    const combatCallbacks: CombatEventCallbacks = {
      onShotFired: (proj, shooter) => {
        this.io.to(this.code).emit('shot:fired', {
          projectile: proj,
          shooterId: shooter.id,
          aimAngle: shooter.aimAngle,
        });
      },
      onProjectileImpact: (x, y, hitTankId, damage, blocked) => {
        this.io.to(this.code).emit('projectile:impact', {
          x,
          y,
          hitTankId,
          damage,
          blocked,
        });
      },
      onTankKilled: (victim, killer, assisters) => {
        this.modeHandler.onTankKilled(
          victim,
          killer,
          assisters,
          this.flags,
          (ev) => this.emitFlagEvent(ev),
          nowMs
        );
        const killFeed: KillFeedEvent = {
          id: `k_${++this.killCounter}`,
          killerId: killer ? killer.id : '',
          killerName: killer ? killer.nickname : 'Environment',
          victimId: victim.id,
          victimName: victim.nickname,
          killerTeam: killer ? killer.team : 'none',
          victimTeam: victim.team,
          timestamp: nowMs,
        };
        this.io.to(this.code).emit('tank:killed', {
          killFeed,
          x: victim.x,
          y: victim.y,
        });
      },
      onTankRespawned: (tank) => {
        this.io.to(this.code).emit('tank:respawned', {
          tankId: tank.id,
          x: tank.x,
          y: tank.y,
        });
      },
    };

    // 1. Update tank movement, ammo regen, and fire queued shots
    for (const tank of this.tanks) {
      const session = this.sessions.get(tank.id);
      if (!session || !session.connected) continue;

      tank.lastProcessedSeq = session.input.seq;
      stepRotationFlip(tank, session.flipState, nowMs, this.settings);
      stepTankMotion(tank, session.input.thrust, dt, map, this.settings, nowMs);
      tank.aimAngle = tank.angle;

      const refilled = tickAmmoRegen(tank, dt, this.settings);
      if (refilled) {
        this.io.to(session.socketId).emit('ammo:refilled', { ammo: tank.ammo });
      }

      if (session.pendingShots > 0) {
        const fired = this.combat.tryFire(
          tank,
          this.settings,
          nowMs,
          this.projectiles,
          combatCallbacks
        );
        if (fired) {
          session.pendingShots -= 1;
        } else if (
          !tank.alive ||
          (tank.ammo <= 0 && !hasPowerUp(tank, 'infinite_ammo', nowMs))
        ) {
          // Drop queued shots that can never fire; keep them while cooling down
          session.pendingShots = 0;
        }
      }
    }

    // 2. Step projectiles and resolve hits
    this.combat.stepProjectiles(
      dt,
      this.projectiles,
      this.tanks,
      map,
      this.mode,
      this.settings,
      nowMs,
      combatCallbacks
    );

    // 3. Step respawns
    this.combat.stepRespawns(
      this.tanks,
      map,
      this.mode,
      this.settings,
      nowMs,
      combatCallbacks
    );

    // 4. Step supply crates and power-ups
    this.powerUps.tick(this.crates, this.tanks, map, this.settings, nowMs, {
      onCrateSpawned: (crate) => {
        this.io.to(this.code).emit('crate:spawned', crate);
      },
      onCrateCollected: (crate, collector) => {
        this.io.to(this.code).emit('crate:collected', {
          crateId: crate.id,
          powerUp: crate.powerUp,
          collectorId: collector.id,
          collectorName: collector.nickname,
          x: crate.x,
          y: crate.y,
        });
      },
    });

    // 5. Mode-specific tick (e.g. CTF flag interactions)
    this.modeHandler.tick(
      this.tanks,
      this.flags,
      map,
      this.teamScores,
      (ev) => this.emitFlagEvent(ev),
      nowMs
    );

    // 6. Check milestone instant-win condition and match timer expiry
    const elapsedSec = (nowMs - this.matchStartTime) / 1000;
    if (checkMilestoneReached(this.mode, this.settings, this.tanks, this.teamScores)) {
      this.io.to(this.code).emit('match:snapshot', this.buildSnapshot(nowMs));
      this.endMatch(Math.max(1, Math.round(elapsedSec)), 'milestone');
      return;
    }

    const remainingSec = Math.max(0, Math.ceil(this.settings.matchDurationSec - elapsedSec));
    if (remainingSec <= 0) {
      this.endMatch(Math.round(elapsedSec), 'timer');
      return;
    }

    // 7. Broadcast snapshot
    this.io.to(this.code).emit('match:snapshot', this.buildSnapshot(nowMs));
  }

  private emitFlagEvent(ev: FlagBannerEvent): void {
    this.io.to(this.code).emit('flag:event', ev);
  }

  private buildSnapshot(nowMs: number): MatchSnapshot {
    const elapsedSec = (nowMs - this.matchStartTime) / 1000;
    const timeRemainingSec = Math.max(
      0,
      Math.ceil(this.settings.matchDurationSec - elapsedSec)
    );
    return {
      serverTime: nowMs,
      timeRemainingSec,
      mode: this.mode,
      mapId: this.mapId,
      tanks: this.tanks,
      projectiles: this.projectiles,
      crates: this.crates,
      flags: this.flags,
      teamScores: { ...this.teamScores },
      dmWinMode: this.settings.dmWinMode,
      killTarget: this.settings.killTarget,
      ctfWinMode: this.settings.ctfWinMode,
      flagTarget: this.settings.flagTarget,
      leaderboard: buildLeaderboard(this.tanks),
    };
  }

  private endMatch(durationSec: number, endReason: 'milestone' | 'timer'): void {
    this.stopLoop();
    this.status = 'ended';
    const map = ARENA_MAPS[this.mapId];
    const result = this.modeHandler.buildMatchResult(
      map,
      durationSec,
      endReason,
      this.tanks,
      this.teamScores
    );
    this.lastMatchResult = result;
    this.broadcastRoomInfo();
    this.io.to(this.code).emit('match:ended', result);
  }
}
