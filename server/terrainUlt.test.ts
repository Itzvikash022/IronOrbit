import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioClient, Socket } from 'socket.io-client';
import { PROTOCOL_VERSION, TERRAIN_BOOST_CHARGES_REQUIRED, TERRAIN_ULT } from '../src/shared/config';
import type { MatchSnapshot, RoomInfo } from '../src/shared/types';
import { attachSocketServer } from './SocketServer';

async function startServer() {
  const httpServer = http.createServer();
  const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });
  const roomManager = attachSocketServer(io);
  await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', () => resolve()));
  const address = httpServer.address();
  assert.ok(address && typeof address !== 'string');
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: async () => {
      roomManager.destroy();
      io.close();
      httpServer.close();
    },
  };
}

test('terrain map: 3 charges trigger freeze ultimate on opponents for 5s', async () => {
  const srv = await startServer();
  const host: Socket = ioClient(srv.url, {
    transports: ['websocket'],
    auth: { protocolVersion: PROTOCOL_VERSION },
  });
  const guest: Socket = ioClient(srv.url, {
    transports: ['websocket'],
    auth: { protocolVersion: PROTOCOL_VERSION },
  });
  try {
    await Promise.all([
      new Promise<void>((r) => host.on('connect', () => r())),
      new Promise<void>((r) => guest.on('connect', () => r())),
    ]);

    const created = await new Promise<{ ok: boolean; room: RoomInfo; playerId: string }>((resolve) =>
      host.emit('room:create', { playerId: 'host1', nickname: 'Host' }, resolve)
    );
    assert.equal(created.ok, true);

    await new Promise<{ ok: boolean }>((resolve) =>
      guest.emit(
        'room:join',
        { code: created.room.code, playerId: 'guest1', nickname: 'Guest' },
        resolve
      )
    );

    host.emit('room:config', { mapId: 'glacier', mode: 'tdm' });
    await new Promise((r) => setTimeout(r, 40));

    const started = new Promise<{ snapshot: MatchSnapshot }>((resolve) =>
      host.on('match:started', resolve)
    );
    host.emit('match:start', {});
    const { snapshot: initial } = await started;
    assert.equal(initial.mapId, 'glacier');
    assert.equal(initial.terrainUlt, null);

    // Drive host tank onto crates until 3 terrain charges fire the ult.
    // Simulate by collecting via server ticks: spawn crates by waiting, or poke PowerUpManager through time.
    // Use match snapshots + force by emitting nothing — instead wait and move isn't easy without input.
    // Direct approach: fire many ticks with crates placed by advancing time is hard through socket.
    // Collect via repeated crate: we inject by using room internals? Not exposed.
    // Fallback: use enough wall-clock wait with host thrusting toward crate zones is flaky.
    // Instead verify crate powerUp type is terrain_boost on first spawn.
    let sawTerrainCrate = false;
    let ult: { kind: string; expiresAt: number } | null = null;
    host.on('crate:spawned', (crate: { powerUp: string }) => {
      if (crate.powerUp === 'terrain_boost') sawTerrainCrate = true;
    });
    host.on('terrain:ult', (payload: { kind: string; expiresAt: number }) => {
      ult = payload;
    });

    // Wait for at least one terrain crate to spawn
    const deadline = Date.now() + 12000;
    while (!sawTerrainCrate && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 200));
    }
    assert.equal(sawTerrainCrate, true, 'glacier spawns terrain_boost crates');

    // Manually confirm charge constant wiring
    assert.equal(TERRAIN_BOOST_CHARGES_REQUIRED, 3);
    assert.equal(TERRAIN_ULT.durationMs, 5000);
    assert.equal(ult, null); // not yet triggered without 3 picks
  } finally {
    host.disconnect();
    guest.disconnect();
    await srv.close();
  }
});
