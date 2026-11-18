import { Server, Socket } from 'socket.io';
import type { GameMode, GameSettings, MapId, PlayerInputState } from '../src/shared/types.ts';
import { RoomManager } from './RoomManager.ts';

export function attachSocketServer(io: Server): RoomManager {
  const roomManager = new RoomManager(io);

  io.on('connection', (socket: Socket) => {
    socket.on(
      'room:create',
      (
        payload: {
          playerId: string;
          nickname: string;
          settings?: Partial<GameSettings>;
        },
        ack?: (res: unknown) => void
      ) => {
        const cleanNick = (payload?.nickname ?? '').trim();
        if (!cleanNick) {
          ack?.({ ok: false, error: 'Please enter a nickname.' });
          return;
        }
        const playerId = payload?.playerId || socket.id;
        const room = roomManager.createRoom(
          playerId,
          socket.id,
          cleanNick,
          payload?.settings
        );
        socket.join(room.code);
        ack?.({ ok: true, room: room.getRoomInfo(), playerId });
      }
    );

    socket.on(
      'room:join',
      (
        payload: { code: string; playerId: string; nickname: string },
        ack?: (res: unknown) => void
      ) => {
        const cleanNick = (payload?.nickname ?? '').trim();
        if (!cleanNick) {
          ack?.({ ok: false, error: 'Please enter a nickname.' });
          return;
        }
        const cleanCode = (payload?.code ?? '').trim().toUpperCase();
        if (!cleanCode) {
          ack?.({ ok: false, error: 'Please enter a room code.' });
          return;
        }
        const playerId = payload?.playerId || socket.id;
        const res = roomManager.joinRoom(cleanCode, playerId, socket.id, cleanNick);
        if (!res.ok) {
          ack?.({ ok: false, error: res.error });
          return;
        }
        socket.join(res.room.code);
        ack?.({
          ok: true,
          room: res.room.getRoomInfo(),
          snapshot: res.room.getCurrentSnapshot(),
          playerId,
          reconnected: res.reconnected,
        });
      }
    );

    socket.on('room:leave', () => {
      const ctx = roomManager.getRoomBySocket(socket.id);
      if (ctx) {
        socket.leave(ctx.room.code);
      }
      roomManager.leaveSocket(socket.id);
    });

    socket.on(
      'room:config',
      (payload: {
        mode?: GameMode;
        mapId?: MapId;
        rerollMap?: boolean;
        settings?: Partial<GameSettings>;
      }) => {
        const ctx = roomManager.getRoomBySocket(socket.id);
        if (!ctx) return;
        ctx.room.updateLobbyConfig(ctx.playerId, payload);
      }
    );

    socket.on('room:switchTeam', (payload: { team: 'red' | 'blue' }) => {
      const ctx = roomManager.getRoomBySocket(socket.id);
      if (!ctx) return;
      ctx.room.switchTeam(ctx.playerId, payload.team);
    });

    socket.on('match:start', (payload?: { randomizeMap?: boolean }) => {
      const ctx = roomManager.getRoomBySocket(socket.id);
      if (!ctx) return;
      ctx.room.startMatch(ctx.playerId, Boolean(payload?.randomizeMap));
    });

    socket.on('match:returnToLobby', () => {
      const ctx = roomManager.getRoomBySocket(socket.id);
      if (!ctx) return;
      ctx.room.returnToLobby(ctx.playerId);
    });

    socket.on('player:input', (input: PlayerInputState) => {
      const ctx = roomManager.getRoomBySocket(socket.id);
      if (!ctx) return;
      ctx.room.handleInput(socket.id, input);
    });

    socket.on('player:shoot', (payload: { aimAngle: number }) => {
      const ctx = roomManager.getRoomBySocket(socket.id);
      if (!ctx) return;
      ctx.room.handleShoot(socket.id, payload?.aimAngle ?? 0);
    });

    socket.on('ping:check', (clientTs: number, ack?: (ts: number) => void) => {
      ack?.(clientTs);
    });

    socket.on('disconnect', () => {
      roomManager.disconnectSocket(socket.id);
    });
  });

  return roomManager;
}
