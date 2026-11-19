import { io, Socket } from 'socket.io-client';
import {
  FlagBannerEvent,
  GameMode,
  GameSettings,
  KillFeedEvent,
  MapId,
  MatchResult,
  MatchSnapshot,
  PlayerInputState,
  ProjectileEntity,
  RoomInfo,
  SupplyCrateEntity,
} from '../shared/types';

function getOrCreatePlayerId(): string {
  if (typeof window === 'undefined') return 'server';
  const existing = window.sessionStorage.getItem('iron_orbit_player_id');
  if (existing) return existing;
  const fresh =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `p_${Math.random().toString(36).slice(2, 11)}`;
  window.sessionStorage.setItem('iron_orbit_player_id', fresh);
  return fresh;
}

export interface RoomSyncPayload {
  room: RoomInfo;
  snapshot: MatchSnapshot | null;
  matchResult: MatchResult | null;
}

export interface NetworkListeners {
  onConnectChange?: (connected: boolean) => void;
  onRoomUpdated?: (room: RoomInfo) => void;
  onRejoinedRoom?: (payload: RoomSyncPayload) => void;
  onSessionExpired?: (reason: string) => void;
  onMatchStarted?: (payload: { room: RoomInfo; snapshot: MatchSnapshot }) => void;
  onMatchSnapshot?: (snapshot: MatchSnapshot) => void;
  onShotFired?: (payload: {
    projectile: ProjectileEntity;
    shooterId: string;
    aimAngle: number;
  }) => void;
  onProjectileImpact?: (payload: {
    x: number;
    y: number;
    hitTankId: string | null;
    damage: number;
    blocked: boolean;
  }) => void;
  onTankKilled?: (payload: {
    killFeed: KillFeedEvent;
    x: number;
    y: number;
  }) => void;
  onTankRespawned?: (payload: { tankId: string; x: number; y: number }) => void;
  onCrateSpawned?: (crate: SupplyCrateEntity) => void;
  onCrateCollected?: (payload: {
    crateId: string;
    powerUp: string;
    collectorId: string;
    collectorName: string;
    x: number;
    y: number;
  }) => void;
  onFlagEvent?: (ev: FlagBannerEvent) => void;
  onAmmoRefilled?: (payload: { ammo: number }) => void;
  onMatchEnded?: (result: MatchResult) => void;
  onReturnedToLobby?: (room: RoomInfo) => void;
  onPlayerDisconnected?: (payload: {
    playerId: string;
    nickname: string;
    temporary: boolean;
    reason?: string;
  }) => void;
  onPlayerReconnected?: (payload: { playerId: string; nickname: string }) => void;
}

export class NetworkClient {
  private socket: Socket | null = null;
  readonly playerId: string;
  private listeners: NetworkListeners = {};
  private lastPingMs = 0;
  private activeRoomCode: string | null = null;
  private activeNickname: string | null = null;
  private rejoinInFlight = false;

  constructor() {
    this.playerId = getOrCreatePlayerId();
  }

  setListeners(listeners: NetworkListeners): void {
    this.listeners = listeners;
  }

  hasActiveRoom(): boolean {
    return Boolean(this.activeRoomCode && this.activeNickname);
  }

  clearActiveRoom(): void {
    this.activeRoomCode = null;
    this.activeNickname = null;
  }

  connect(): Socket {
    if (this.socket) {
      if (this.socket.disconnected) {
        this.socket.connect();
      }
      return this.socket;
    }

    const serverUrl = (import.meta.env.VITE_SERVER_URL as string | undefined)?.trim();
    const opts = {
      transports: ['websocket', 'polling'],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      timeout: 20000,
    };

    this.socket = serverUrl ? io(serverUrl, opts) : io(opts);

    this.socket.on('connect', () => {
      this.listeners.onConnectChange?.(true);
      if (this.activeRoomCode && this.activeNickname) {
        void this.rejoinActiveRoom();
      }
    });
    this.socket.on('disconnect', () => {
      this.listeners.onConnectChange?.(false);
    });

    this.socket.on('room:updated', (room: RoomInfo) => {
      this.listeners.onRoomUpdated?.(room);
    });
    this.socket.on(
      'match:started',
      (payload: { room: RoomInfo; snapshot: MatchSnapshot }) => {
        this.listeners.onMatchStarted?.(payload);
      }
    );
    this.socket.on('match:snapshot', (snapshot: MatchSnapshot) => {
      this.listeners.onMatchSnapshot?.(snapshot);
    });
    this.socket.on('shot:fired', (payload) => {
      this.listeners.onShotFired?.(payload);
    });
    this.socket.on('projectile:impact', (payload) => {
      this.listeners.onProjectileImpact?.(payload);
    });
    this.socket.on('tank:killed', (payload) => {
      this.listeners.onTankKilled?.(payload);
    });
    this.socket.on('tank:respawned', (payload) => {
      this.listeners.onTankRespawned?.(payload);
    });
    this.socket.on('crate:spawned', (crate) => {
      this.listeners.onCrateSpawned?.(crate);
    });
    this.socket.on('crate:collected', (payload) => {
      this.listeners.onCrateCollected?.(payload);
    });
    this.socket.on('flag:event', (ev) => {
      this.listeners.onFlagEvent?.(ev);
    });
    this.socket.on('ammo:refilled', (payload) => {
      this.listeners.onAmmoRefilled?.(payload);
    });
    this.socket.on('match:ended', (result) => {
      this.listeners.onMatchEnded?.(result);
    });
    this.socket.on('room:returnedToLobby', (room) => {
      this.listeners.onReturnedToLobby?.(room);
    });
    this.socket.on('player:disconnected', (payload) => {
      this.listeners.onPlayerDisconnected?.(payload);
    });
    this.socket.on('player:reconnected', (payload) => {
      this.listeners.onPlayerReconnected?.(payload);
    });

    return this.socket;
  }

  private async rejoinActiveRoom(): Promise<void> {
    if (this.rejoinInFlight || !this.activeRoomCode || !this.activeNickname || !this.socket?.connected) {
      return;
    }
    this.rejoinInFlight = true;
    const code = this.activeRoomCode;
    const nickname = this.activeNickname;
    try {
      const res = await new Promise<
        | ({ ok: true } & RoomSyncPayload)
        | { ok: false; error: string }
      >((resolve) => {
        this.socket!.timeout(10000).emit(
          'room:join',
          { code, playerId: this.playerId, nickname },
          (
            err: Error | null,
            ack?: ({ ok: true } & RoomSyncPayload) | { ok: false; error: string }
          ) => {
            if (err || !ack) {
              resolve({ ok: false, error: '__timeout__' });
              return;
            }
            resolve(ack);
          }
        );
      });

      // Ignore if the user intentionally left while rejoin was in flight
      if (this.activeRoomCode !== code) return;

      if (res.ok) {
        this.listeners.onRejoinedRoom?.({
          room: res.room,
          snapshot: res.snapshot,
          matchResult: res.matchResult ?? null,
        });
      } else if (res.error !== '__timeout__') {
        this.clearActiveRoom();
        this.listeners.onSessionExpired?.(res.error);
      }
    } finally {
      this.rejoinInFlight = false;
    }
  }

  async syncCurrentRoom(): Promise<void> {
    if (!this.activeRoomCode || !this.activeNickname) return;
    const socket = this.connect();
    if (!socket.connected) {
      socket.connect();
      return;
    }

    const res = await new Promise<
      | ({ ok: true } & RoomSyncPayload)
      | { ok: false; error: string }
    >((resolve) => {
      socket.timeout(8000).emit(
        'room:sync',
        (
          err: Error | null,
          ack?: ({ ok: true } & RoomSyncPayload) | { ok: false; error: string }
        ) => {
          if (err || !ack) {
            resolve({ ok: false, error: '__timeout__' });
            return;
          }
          resolve(ack);
        }
      );
    });

    if (res.ok) {
      this.listeners.onRejoinedRoom?.({
        room: res.room,
        snapshot: res.snapshot,
        matchResult: res.matchResult ?? null,
      });
    } else if (res.error !== '__timeout__') {
      await this.rejoinActiveRoom();
    }
  }

  async createRoom(
    nickname: string,
    settings?: Partial<GameSettings>
  ): Promise<{ ok: true; room: RoomInfo } | { ok: false; error: string }> {
    const socket = this.connect();
    return new Promise((resolve) => {
      socket.timeout(10000).emit(
        'room:create',
        { playerId: this.playerId, nickname, settings },
        (
          err: Error | null,
          res?: { ok: true; room: RoomInfo } | { ok: false; error: string }
        ) => {
          if (err || !res) {
            resolve({
              ok: false,
              error: 'Server did not respond. Please check your connection and try again.',
            });
            return;
          }
          if (res.ok) {
            this.activeRoomCode = res.room.code;
            this.activeNickname = nickname;
          }
          resolve(res);
        }
      );
    });
  }

  async joinRoom(
    code: string,
    nickname: string
  ): Promise<
    | ({ ok: true } & RoomSyncPayload)
    | { ok: false; error: string }
  > {
    const socket = this.connect();
    return new Promise((resolve) => {
      socket.timeout(10000).emit(
        'room:join',
        { code, playerId: this.playerId, nickname },
        (
          err: Error | null,
          res?:
            | ({ ok: true } & RoomSyncPayload)
            | { ok: false; error: string }
        ) => {
          if (err || !res) {
            resolve({
              ok: false,
              error: 'Server did not respond. Please check your connection and try again.',
            });
            return;
          }
          if (res.ok) {
            this.activeRoomCode = res.room.code;
            this.activeNickname = nickname;
            resolve({
              ok: true,
              room: res.room,
              snapshot: res.snapshot ?? null,
              matchResult: res.matchResult ?? null,
            });
            return;
          }
          resolve(res);
        }
      );
    });
  }

  leaveRoom(): void {
    this.clearActiveRoom();
    this.socket?.emit('room:leave');
  }

  updateRoomConfig(payload: {
    mode?: GameMode;
    mapId?: MapId;
    rerollMap?: boolean;
    settings?: Partial<GameSettings>;
  }): void {
    this.socket?.emit('room:config', payload);
  }

  switchTeam(team: 'red' | 'blue'): void {
    this.socket?.emit('room:switchTeam', { team });
  }

  startMatch(randomizeMap = false): void {
    this.socket?.emit('match:start', { randomizeMap });
  }

  returnToLobby(): void {
    this.socket?.emit('match:returnToLobby');
  }

  sendInput(input: PlayerInputState): void {
    if (!this.socket?.connected) return;
    this.socket.emit('player:input', input);
  }

  sendShoot(aimAngle: number): void {
    if (!this.socket?.connected) return;
    this.socket.emit('player:shoot', { aimAngle });
  }

  measurePing(cb: (ms: number) => void): void {
    if (!this.socket || !this.socket.connected) return;
    const t0 = performance.now();
    this.socket.emit('ping:check', t0, () => {
      this.lastPingMs = Math.round(performance.now() - t0);
      cb(this.lastPingMs);
    });
  }
}

export const networkClient = new NetworkClient();
