import { Server } from 'socket.io';
import type { GameSettings } from '../src/shared/types.ts';
import { GameRoom } from './GameRoom.ts';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export class RoomManager {
  private rooms = new Map<string, GameRoom>();
  private socketRoomMap = new Map<string, { code: string; playerId: string }>();
  private sweepTimer: NodeJS.Timeout;
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.sweepTimer = setInterval(() => {
      const now = Date.now();
      for (const room of this.rooms.values()) {
        room.cleanupDisconnected(now);
      }
    }, 3000);
  }

  createRoom(
    playerId: string,
    socketId: string,
    nickname: string,
    initialSettings?: Partial<GameSettings>
  ): GameRoom {
    // Leave any prior room attached to this socket
    this.leaveSocket(socketId);

    const code = this.generateUniqueCode();
    const room = new GameRoom(
      code,
      playerId,
      socketId,
      nickname,
      this.io,
      (emptyCode) => {
        this.rooms.delete(emptyCode);
      },
      initialSettings
    );
    this.rooms.set(code, room);
    this.socketRoomMap.set(socketId, { code, playerId });
    return room;
  }

  joinRoom(
    codeInput: string,
    playerId: string,
    socketId: string,
    nickname: string
  ): { ok: true; room: GameRoom; reconnected: boolean } | { ok: false; error: string } {
    const code = codeInput.trim().toUpperCase();
    const room = this.rooms.get(code);
    if (!room) {
      return { ok: false, error: `Room "${code}" was not found.` };
    }

    const prev = this.socketRoomMap.get(socketId);
    if (prev && prev.code !== code) {
      this.leaveSocket(socketId);
    }

    const res = room.joinPlayer(playerId, socketId, nickname);
    if (!res.ok) return res;

    this.socketRoomMap.set(socketId, { code, playerId });
    return { ok: true, room, reconnected: res.reconnected };
  }

  getRoomBySocket(socketId: string): { room: GameRoom; playerId: string } | null {
    const mapping = this.socketRoomMap.get(socketId);
    if (!mapping) return null;
    const room = this.rooms.get(mapping.code);
    if (!room) {
      this.socketRoomMap.delete(socketId);
      return null;
    }
    return { room, playerId: mapping.playerId };
  }

  leaveSocket(socketId: string): void {
    const mapping = this.socketRoomMap.get(socketId);
    if (!mapping) return;
    this.socketRoomMap.delete(socketId);
    const room = this.rooms.get(mapping.code);
    if (room) {
      room.removePlayer(mapping.playerId, 'left');
    }
  }

  disconnectSocket(socketId: string): void {
    const mapping = this.socketRoomMap.get(socketId);
    if (!mapping) return;
    const room = this.rooms.get(mapping.code);
    if (room) {
      room.handleDisconnect(socketId);
    }
  }

  destroy(): void {
    clearInterval(this.sweepTimer);
    for (const room of this.rooms.values()) {
      room.stopLoop();
    }
    this.rooms.clear();
  }

  private generateUniqueCode(): string {
    for (let attempt = 0; attempt < 20; attempt++) {
      let code = '';
      for (let i = 0; i < 5; i++) {
        code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
      }
      if (!this.rooms.has(code)) return code;
    }
    return `${Date.now().toString(36).slice(-5).toUpperCase()}`;
  }
}
