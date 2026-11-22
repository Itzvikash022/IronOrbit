import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioClient, Socket } from 'socket.io-client';
import { attachSocketServer } from './SocketServer';
import { PowerUpManager } from './PowerUpManager';
import { DEFAULT_GAME_SETTINGS } from '../src/shared/config';
import { ARENA_MAPS } from '../src/shared/maps';
import { MatchResult, MatchSnapshot, RoomInfo, SupplyCrateEntity } from '../src/shared/types';

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

test('seamless reconnect on new socket restores active tank, ignores stale socket disconnect, and syncs live match state', async () => {
  const httpServer = http.createServer();
  const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });
  const roomManager = attachSocketServer(io);

  await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const address = httpServer.address();
  assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}`;

  const host = await connectClient(url);
  const guestOld = await connectClient(url);
  let guestNew: Socket | null = null;

  try {
    const createRes = await new Promise<{ ok: boolean; room: RoomInfo }>((resolve) => {
      host.emit('room:create', { playerId: 'host1', nickname: 'HostOne' }, resolve);
    });
    assert.equal(createRes.ok, true);
    const code = createRes.room.code;

    const joinRes = await new Promise<{ ok: boolean; room: RoomInfo }>((resolve) => {
      guestOld.emit('room:join', { code, playerId: 'guest1', nickname: 'GuestOne' }, resolve);
    });
    assert.equal(joinRes.ok, true);

    // Guest drops connection in lobby before match starts
    const tempDiscPromise = new Promise<{ playerId: string; temporary: boolean }>((resolve) => {
      host.once('player:disconnected', resolve);
    });
    guestOld.disconnect();
    const discEvent = await tempDiscPromise;
    assert.equal(discEvent.playerId, 'guest1');
    assert.equal(discEvent.temporary, true);

    // Host starts the match while guest is temporarily disconnected
    const startedPromise = new Promise<{ room: RoomInfo; snapshot: MatchSnapshot }>((resolve) => {
      host.once('match:started', resolve);
    });
    host.emit('match:start', { randomizeMap: false });
    await startedPromise;

    // Guest reconnects on a brand-new socket with the same playerId
    guestNew = await connectClient(url);
    const reconnectedNotice = new Promise<{ playerId: string; nickname: string }>((resolve) => {
      host.once('player:reconnected', resolve);
    });
    const rejoinRes = await new Promise<{
      ok: boolean;
      reconnected: boolean;
      room: RoomInfo;
      snapshot: MatchSnapshot | null;
    }>((resolve) => {
      guestNew!.emit('room:join', { code, playerId: 'guest1', nickname: 'GuestOne' }, resolve);
    });

    assert.equal(rejoinRes.ok, true);
    assert.equal(rejoinRes.reconnected, true);
    assert.equal(rejoinRes.room.status, 'playing');
    assert.ok(rejoinRes.snapshot, 'rejoin during active match must return live snapshot');
    const guestTank = rejoinRes.snapshot!.tanks.find((t) => t.id === 'guest1')!;
    assert.ok(guestTank, 'guest tank should be present in live snapshot');
    assert.equal(guestTank.connected, true);

    const reconnEv = await reconnectedNotice;
    assert.equal(reconnEv.playerId, 'guest1');

    // Verify room:sync returns authoritative room & snapshot
    const syncRes = await new Promise<{
      ok: boolean;
      room: RoomInfo;
      snapshot: MatchSnapshot | null;
    }>((resolve) => {
      guestNew!.emit('room:sync', resolve);
    });
    assert.equal(syncRes.ok, true);
    assert.equal(syncRes.room.status, 'playing');
    assert.ok(syncRes.snapshot, 'room:sync must include current match snapshot');

    // Verify reconnected guest can immediately send input & fire
    guestNew.emit('player:shoot', { aimAngle: 0 });
    const postShotSnap = await new Promise<MatchSnapshot>((resolve) => {
      const handler = (snap: MatchSnapshot) => {
        const gt = snap.tanks.find((t) => t.id === 'guest1');
        if (gt && gt.ammo < 6) {
          guestNew!.off('match:snapshot', handler);
          resolve(snap);
        }
      };
      guestNew!.on('match:snapshot', handler);
    });
    assert.equal(postShotSnap.tanks.find((t) => t.id === 'guest1')!.ammo, 5);
  } finally {
    host.disconnect();
    guestOld.disconnect();
    guestNew?.disconnect();
    roomManager.destroy();
    io.close();
    httpServer.close();
  }
});

test('PowerUpManager caps active boosts at 3 and waits full interval before replacing a taken crate', () => {
  const manager = new PowerUpManager();
  const map = ARENA_MAPS.industrial;
  const crates: SupplyCrateEntity[] = [];
  const settings = { ...DEFAULT_GAME_SETTINGS, crateSpawnIntervalMs: 5000, crateDespawnMs: 60000, maxActiveCrates: 3 };
  let now = 1000;
  manager.reset(now);

  // Advance 4 intervals -> must cap at 3 crates
  for (let i = 1; i <= 5; i++) {
    now += 5000;
    manager.tick(crates, [], map, settings, now, {
      onCrateSpawned: () => {},
      onCrateCollected: () => {},
    });
  }
  assert.equal(crates.length, 3);

  // Remove 1 crate (taken by player), then tick 100ms later -> must NOT spawn instantly
  crates.pop();
  assert.equal(crates.length, 2);
  now += 100;
  manager.tick(crates, [], map, settings, now, {
    onCrateSpawned: () => {},
    onCrateCollected: () => {},
  });
  assert.equal(crates.length, 2);

  // Advance full interval -> replacement spawns back up to 3
  now += 5000;
  manager.tick(crates, [], map, settings, now, {
    onCrateSpawned: () => {},
    onCrateCollected: () => {},
  });
  assert.equal(crates.length, 3);
});

test('shoot press flips rotationDir even at zero ammo and DM/CTF milestones end match immediately', async () => {
  const httpServer = http.createServer();
  const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });
  const roomManager = attachSocketServer(io);

  await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const address = httpServer.address();
  assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}`;

  const p1 = await connectClient(url);
  const p2 = await connectClient(url);

  try {
    // Create room with killTarget = 3 and maxAmmo = 3, and shoot with 0 ammo
    const createRes = await new Promise<{ ok: boolean; room: RoomInfo }>((resolve) => {
      p1.emit(
        'room:create',
        {
          playerId: 'm1',
          nickname: 'Marksman',
          settings: { maxAmmo: 3, ammoRegenTimeMs: 4000, dmWinMode: 'milestone', killTarget: 3 },
        },
        resolve
      );
    });
    assert.equal(createRes.ok, true);
    const code = createRes.room.code;

    await new Promise((resolve) => {
      p2.emit('room:join', { code, playerId: 'm2', nickname: 'TargetDummy' }, resolve);
    });

    const startPromise = new Promise<{ room: RoomInfo; snapshot: MatchSnapshot }>((resolve) => {
      p1.once('match:started', resolve);
    });
    p1.emit('match:start', { randomizeMap: false });
    const started = await startPromise;
    assert.equal(started.snapshot.tanks.find((t) => t.id === 'm1')!.rotationDir, 1);

    // Exhaust all 3 shells (3 presses = odd) -> settle -> direction flips to -1
    for (let i = 0; i < 3; i++) {
      p1.emit('player:shoot', { aimAngle: 0 });
      await new Promise((r) => setTimeout(r, 310));
    }

    const emptySnap = await new Promise<MatchSnapshot>((resolve) => {
      const handler = (snap: MatchSnapshot) => {
        const t = snap.tanks.find((x) => x.id === 'm1')!;
        if (t.ammo === 0 && t.rotationDir === -1) {
          p1.off('match:snapshot', handler);
          resolve(snap);
        }
      };
      p1.on('match:snapshot', handler);
    });
    assert.equal(emptySnap.tanks.find((t) => t.id === 'm1')!.rotationDir, -1);

    // Press once more at 0 ammo -> still flips back to +1 after settle
    p1.emit('player:shoot', { aimAngle: 0 });
    const flippedEmptySnap = await new Promise<MatchSnapshot>((resolve) => {
      const handler = (snap: MatchSnapshot) => {
        const t = snap.tanks.find((x) => x.id === 'm1')!;
        if (t.rotationDir === 1) {
          p1.off('match:snapshot', handler);
          resolve(snap);
        }
      };
      p1.on('match:snapshot', handler);
    });
    assert.equal(flippedEmptySnap.tanks.find((t) => t.id === 'm1')!.rotationDir, 1);

    // Force milestone condition on room directly via tank kills to verify instant match:ended
    const ctx = roomManager.getRoomBySocket(p1.id!)!;
    const endedPromise = new Promise<MatchResult>((resolve) => {
      p1.once('match:ended', resolve);
    });
    const snapInternal = ctx.room.getCurrentSnapshot()!;
    snapInternal.tanks.find((t) => t.id === 'm1')!.kills = 3;
    const ended = await endedPromise;
    assert.equal(ended.endReason, 'milestone');
    assert.equal(ended.winnerId, 'm1');
  } finally {
    p1.disconnect();
    p2.disconnect();
    roomManager.destroy();
    io.close();
    httpServer.close();
  }
});

test('bots: solo CTF allowed, second human blocked while CTF+bots, kill modes allow bots', async () => {
  const httpServer = http.createServer();
  const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });
  const roomManager = attachSocketServer(io);

  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const address = httpServer.address();
  assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}`;

  const host = await connectClient(url);
  const guest = await connectClient(url);

  try {
    const created = await new Promise((resolve) => {
      host.emit('room:create', { playerId: 'hostB', nickname: 'HostBot' }, resolve);
    });
    assert.equal(created.ok, true);
    const code = created.room.code;

    host.emit('room:config', { mode: 'ctf' });
    await new Promise((r) => setTimeout(r, 40));

    const botsOk = await new Promise((resolve) => {
      host.emit('room:bots', { count: 2, difficulty: 'noob' }, resolve);
    });
    assert.equal(botsOk.ok, true);

    const blocked = await new Promise((resolve) => {
      guest.emit('room:join', { code, playerId: 'guestB', nickname: 'GuestBot' }, resolve);
    });
    assert.equal(blocked.ok, false);
    assert.match(blocked.error, /bots/i);

    host.emit('room:config', { mode: 'tdm' });
    await new Promise((r) => setTimeout(r, 40));

    const joined = await new Promise((resolve) => {
      guest.emit('room:join', { code, playerId: 'guestB', nickname: 'GuestBot' }, resolve);
    });
    assert.equal(joined.ok, true);
    assert.ok(joined.room.players.filter((p) => p.isBot).length >= 1);
    assert.equal(joined.room.settings.killTarget, 40);
  } finally {
    host.disconnect();
    guest.disconnect();
    roomManager.destroy();
    io.close();
    httpServer.close();
  }
});
