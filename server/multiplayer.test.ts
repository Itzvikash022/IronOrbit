import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioClient, Socket } from 'socket.io-client';
import { attachSocketServer } from './SocketServer';
import { MatchSnapshot, RoomInfo } from '../src/shared/types';

function connectClient(url: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const client = ioClient(url, { transports: ['websocket'] });
    client.on('connect', () => resolve(client));
    client.on('connect_error', reject);
  });
}

test('multiplayer room creation, duplicate-nickname guard, isolation, CTF teams, and authoritative shooting/movement', async () => {
  const httpServer = http.createServer();
  const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });
  const roomManager = attachSocketServer(io);

  await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const address = httpServer.address();
  assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}`;

  const c1 = await connectClient(url);
  const c2 = await connectClient(url);
  const c3 = await connectClient(url);

  try {
    // 1. Client 1 creates room
    const createRes = await new Promise<{ ok: boolean; room: RoomInfo }>((resolve) => {
      c1.emit('room:create', { playerId: 'p1', nickname: 'Alpha' }, resolve);
    });
    assert.equal(createRes.ok, true);
    const roomCode = createRes.room.code;

    // 2. Duplicate nickname rejected
    const dupRes = await new Promise<{ ok: boolean; error?: string }>((resolve) => {
      c2.emit('room:join', { code: roomCode, playerId: 'p2', nickname: 'alpha' }, resolve);
    });
    assert.equal(dupRes.ok, false);

    // 3. Client 2 joins with unique nickname
    const joinRes = await new Promise<{ ok: boolean; room: RoomInfo }>((resolve) => {
      c2.emit('room:join', { code: roomCode, playerId: 'p2', nickname: 'Bravo' }, resolve);
    });
    assert.equal(joinRes.ok, true);
    assert.equal(joinRes.room.players.length, 2);

    // 4. Client 3 creates separate isolated room
    const createRoom2 = await new Promise<{ ok: boolean; room: RoomInfo }>((resolve) => {
      c3.emit('room:create', { playerId: 'p3', nickname: 'Alpha' }, resolve);
    });
    assert.equal(createRoom2.ok, true);
    assert.notEqual(createRoom2.room.code, roomCode);

    // 5. Switch Room 1 to CTF and verify balanced team assignment
    const updatedLobbyPromise = new Promise<RoomInfo>((resolve) => {
      c2.once('room:updated', resolve);
    });
    c1.emit('room:config', { mode: 'ctf' });
    const ctfRoom = await updatedLobbyPromise;
    assert.equal(ctfRoom.mode, 'ctf');
    assert.notEqual(ctfRoom.players[0].team, ctfRoom.players[1].team);

    // 6. Start match & verify snapshots + shooting + thrust
    const startedPromise = new Promise<{ room: RoomInfo; snapshot: MatchSnapshot }>((resolve) => {
      c2.once('match:started', resolve);
    });
    c1.emit('match:start', { randomizeMap: false });
    const started = await startedPromise;
    assert.equal(started.snapshot.tanks.length, 2);
    const p1Start = started.snapshot.tanks.find((t) => t.id === 'p1')!;
    assert.equal(p1Start.ammo, 6);

    // Fire shot with mismatched pointer aimAngle + hold Spacebar thrust:
    // tank must lock angle and fire strictly along tank.angle
    const mismatchedAim = p1Start.angle + Math.PI;
    c1.emit('player:input', { seq: 1, thrust: true, aimAngle: mismatchedAim });
    c1.emit('player:shoot', { aimAngle: mismatchedAim });

    const nextSnap = await new Promise<MatchSnapshot>((resolve) => {
      const handler = (snap: MatchSnapshot) => {
        const t1 = snap.tanks.find((t) => t.id === 'p1')!;
        if (t1.ammo < 6 && snap.projectiles.length > 0) {
          c1.off('match:snapshot', handler);
          resolve(snap);
        }
      };
      c1.on('match:snapshot', handler);
    });

    const p1After = nextSnap.tanks.find((t) => t.id === 'p1')!;
    const firedProj = nextSnap.projectiles.find((p) => p.ownerId === 'p1')!;
    assert.ok(firedProj, 'p1 projectile should exist in snapshot');
    assert.equal(p1After.ammo, 5);
    assert.ok(
      Math.abs(p1After.angle - p1Start.angle) < 0.25,
      'p1 heading should lock near starting angle while thrusting'
    );
    const projAngle = Math.atan2(firedProj.vy, firedProj.vx);
    const angleDelta = Math.abs(
      Math.atan2(Math.sin(projAngle - p1After.angle), Math.cos(projAngle - p1After.angle))
    );
    assert.ok(
      angleDelta < 0.05,
      `projectile should fire strictly along tank.angle (${p1After.angle}), got ${projAngle}`
    );
    assert.ok(
      p1After.x !== p1Start.x || p1After.y !== p1Start.y,
      'p1 should move under authoritative thrust'
    );
  } finally {
    c1.disconnect();
    c2.disconnect();
    c3.disconnect();
    roomManager.destroy();
    io.close();
    httpServer.close();
  }
});
