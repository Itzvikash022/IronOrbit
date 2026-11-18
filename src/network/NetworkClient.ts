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

export interface NetworkListeners {
  onConnectChange?: (connected: boolean) => void;
  onRoomUpdated?: (room: RoomInfo) => void;
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
}

export class NetworkClient {
  private socket: Socket | null = null;
  readonly playerId: string;
  private listeners: NetworkListeners = {};
  private lastPingMs = 0;

  constructor() {
    this.playerId = getOrCreatePlayerId();
  }

  setListeners(listeners: NetworkListeners): void {
    this.listeners = listeners;
  }

  connect(): Socket {
    if (this.socket) return this.socket;
    this.socket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 600,
    });

    this.socket.on('connect', () => {
      this.listeners.onConnectChange?.(true);
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

    return this.socket;
  }

  async createRoom(
    nickname: string,
    settings?: Partial<GameSettings>
  ): Promise<{ ok: true; room: RoomInfo } | { ok: false; error: string }> {
    const socket = this.connect();
    return new Promise((resolve) => {
      socket.emit(
        'room:create',
        { playerId: this.playerId, nickname, settings },
        (res: { ok: true; room: RoomInfo } | { ok: false; error: string }) => {
          resolve(res);
        }
      );
    });
  }

  async joinRoom(
    code: string,
    nickname: string
  ): Promise<
    | { ok: true; room: RoomInfo; snapshot: MatchSnapshot | null }
    | { ok: false; error: string }
  > {
    const socket = this.connect();
    return new Promise((resolve) => {
      socket.emit(
        'room:join',
        { code, playerId: this.playerId, nickname },
        (
          res:
            | { ok: true; room: RoomInfo; snapshot: MatchSnapshot | null }
            | { ok: false; error: string }
        ) => {
          resolve(res);
        }
      );
    });
  }

  leaveRoom(): void {
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
    this.socket?.emit('player:input', input);
  }

  sendShoot(aimAngle: number): void {
    this.socket?.emit('player:shoot', { aimAngle });
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
