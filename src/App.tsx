import { useCallback, useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { soundManager } from './audio/SoundManager';
import { GameHud } from './components/GameHud';
import { MatchResultsModal } from './components/MatchResultsModal';
import { PauseModal } from './components/PauseModal';
import { RoomLobby } from './components/RoomLobby';
import { SettingsModal } from './components/SettingsModal';
import { TitleScreen } from './components/TitleScreen';
import { ArenaScene, type ArenaEnvStatus } from './game/ArenaScene';
import { networkClient } from './network/NetworkClient';
import { DEFAULT_ACTION_BIND, sanitizeActionBind } from './shared/actionBind';
import { DEFAULT_GAME_SETTINGS } from './shared/config';
import {
  BotDifficulty,
  ClientPreferences,
  FlagBannerEvent,
  GameMode,
  GameSettings,
  KillFeedEvent,
  MapId,
  MatchResult,
  MatchSnapshot,
  RoomInfo,
} from './shared/types';

type ShellState = 'title' | 'lobby' | 'playing' | 'paused' | 'gameover';

const PREFS_STORAGE_KEY = 'iron_orbit_prefs';

function loadPreferences(): ClientPreferences {
  const defaults: ClientPreferences = {
    soundVolume: 0.65,
    muted: false,
    graphicsQuality: 'high',
    actionBind: { ...DEFAULT_ACTION_BIND },
  };
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<ClientPreferences>;
    return {
      soundVolume:
        typeof parsed.soundVolume === 'number'
          ? Math.max(0, Math.min(1, parsed.soundVolume))
          : defaults.soundVolume,
      muted: Boolean(parsed.muted),
      graphicsQuality: parsed.graphicsQuality === 'medium' ? 'medium' : 'high',
      actionBind: sanitizeActionBind(parsed.actionBind),
    };
  } catch {
    return defaults;
  }
}

export default function App() {
  const phaserMountRef = useRef<HTMLDivElement | null>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<ArenaScene | null>(null);
  const lastHudSnapRef = useRef<MatchSnapshot | null>(null);
  const lastHudSyncAtRef = useRef<number>(0);

  const [shellState, setShellState] = useState<ShellState>('title');
  const shellStateRef = useRef<ShellState>('title');
  const [nickname, setNickname] = useState<string>(() => {
    if (typeof window === 'undefined') return 'Vanguard';
    return window.localStorage.getItem('iron_orbit_nick') || 'Vanguard';
  });
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [snapshot, setSnapshot] = useState<MatchSnapshot | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [botsError, setBotsError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [killFeed, setKillFeed] = useState<KillFeedEvent[]>([]);
  const [flagBanner, setFlagBanner] = useState<FlagBannerEvent | null>(null);
  const [disconnectNotice, setDisconnectNotice] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [versionMismatch, setVersionMismatch] = useState(false);
  const [envStatus, setEnvStatus] = useState<ArenaEnvStatus | null>(null);

  const [preferences, setPreferences] = useState<ClientPreferences>(() => loadPreferences());
  const [customSettings, setCustomSettings] = useState<GameSettings>({
    ...DEFAULT_GAME_SETTINGS,
  });

  // Sync shell state to document.body.dataset.state & scene input gate
  useEffect(() => {
    shellStateRef.current = shellState;
    document.body.dataset.state = shellState;
    if (shellState !== 'playing' && shellState !== 'paused') setEnvStatus(null);
    sceneRef.current?.setInputEnabled(shellState === 'playing' && !showSettings);
    const shouldSleepCanvas = shellState === 'lobby' || shellState === 'gameover';
    sceneRef.current?.setAttractPaused(shouldSleepCanvas);
    if (shouldSleepCanvas) {
      phaserGameRef.current?.loop.sleep();
    } else {
      phaserGameRef.current?.loop.wake();
    }
  }, [shellState, showSettings]);

  // Keep SoundManager / scene synced with preferences and persist them
  useEffect(() => {
    soundManager.setVolume(preferences.soundVolume);
    soundManager.setMuted(preferences.muted);
    sceneRef.current?.setGraphicsQuality(preferences.graphicsQuality);
    sceneRef.current?.setActionBind(preferences.actionBind);
    try {
      window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      /* ignore quota / private mode */
    }
  }, [preferences]);

  const showTempDisconnect = useCallback((msg: string) => {
    setDisconnectNotice(msg);
    setTimeout(() => {
      setDisconnectNotice((cur) => (cur === msg ? null : cur));
    }, 4500);
  }, []);

  const syncToRoomState = useCallback(
    (
      nextRoom: RoomInfo,
      nextSnapshot: MatchSnapshot | null,
      nextMatchResult: MatchResult | null
    ) => {
      setRoom(nextRoom);
      sceneRef.current?.updateSettings(nextRoom.settings);

      if (nextRoom.status === 'playing' && nextSnapshot) {
        lastHudSnapRef.current = nextSnapshot;
        lastHudSyncAtRef.current = performance.now();
        setSnapshot(nextSnapshot);
        setMatchResult(null);

        const wasPlaying =
          shellStateRef.current === 'playing' || shellStateRef.current === 'paused';
        if (!wasPlaying) {
          setShellState('playing');
          sceneRef.current?.startActiveMatch(
            nextRoom.mapId,
            nextRoom.mode,
            networkClient.playerId,
            nextRoom.settings,
            nextSnapshot
          );
        } else {
          sceneRef.current?.resyncSnapshot(nextSnapshot);
        }
      } else if (nextRoom.status === 'ended' && nextMatchResult) {
        setMatchResult(nextMatchResult);
        setSnapshot(null);
        setShellState('gameover');
      } else {
        setSnapshot(null);
        setMatchResult(null);
        setShowLeaderboard(false);
        setShellState('lobby');
        sceneRef.current?.enterAttractMode(nextRoom.mapId);
      }
    },
    []
  );

  // Mount Phaser once + attach Socket.IO listeners
  useEffect(() => {
    if (!phaserMountRef.current || phaserGameRef.current) return;

    const arenaScene = new ArenaScene();
    sceneRef.current = arenaScene;

    arenaScene.setBridge({
      onSendInput: (input) => networkClient.sendInput(input),
      onSendShoot: (aimAngle) => networkClient.sendShoot(aimAngle),
      onEnvStatus: (status) => setEnvStatus(status),
    });
    arenaScene.setActionBind(preferences.actionBind);

    const game = new Phaser.Game({
      type: Phaser.CANVAS,
      parent: phaserMountRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#0b0f14',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [arenaScene],
    });
    phaserGameRef.current = game;

    networkClient.setListeners({
      onVersionMismatch: () => setVersionMismatch(true),
      onConnectChange: (connected) => {
        if (!connected) {
          setPingMs(null);
          if (networkClient.hasActiveRoom()) {
            setReconnecting(true);
          }
        } else {
          networkClient.measurePing((ms) => setPingMs(ms));
          if (!networkClient.hasActiveRoom()) {
            setReconnecting(false);
          }
        }
      },
      onRejoinedRoom: ({ room: syncedRoom, snapshot: syncedSnap, matchResult: syncedResult }) => {
        setReconnecting(false);
        syncToRoomState(syncedRoom, syncedSnap, syncedResult);
      },
      onSessionExpired: (reason) => {
        setReconnecting(false);
        setRoom(null);
        setSnapshot(null);
        setMatchResult(null);
        setShowSettings(false);
        setShowLeaderboard(false);
        setShellState('title');
        setError(`Session ended: ${reason}`);
        sceneRef.current?.enterAttractMode('industrial');
      },
      onRoomUpdated: (updatedRoom) => {
        setRoom(updatedRoom);
        sceneRef.current?.updateSettings(updatedRoom.settings);
      },
      onMatchStarted: ({ room: startedRoom, snapshot: initialSnap }) => {
        setRoom(startedRoom);
        setSnapshot(initialSnap);
        setMatchResult(null);
        setKillFeed([]);
        setFlagBanner(null);
        setShowLeaderboard(false);
        setShellState('playing');
        soundManager.playMatchStart();

        // Blur focused button and pass control to arena
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }

        sceneRef.current?.startActiveMatch(
          startedRoom.mapId,
          startedRoom.mode,
          networkClient.playerId,
          startedRoom.settings,
          initialSnap
        );
      },
      onMatchSnapshot: (snap) => {
        sceneRef.current?.applySnapshot(snap);
        const now = performance.now();
        const prev = lastHudSnapRef.current;
        const localPrev = prev?.tanks.find((t) => t.id === networkClient.playerId);
        const localNext = snap.tanks.find((t) => t.id === networkClient.playerId);
        const changedDiscrete =
          !prev ||
          prev.timeRemainingSec !== snap.timeRemainingSec ||
          prev.teamScores.red !== snap.teamScores.red ||
          prev.teamScores.blue !== snap.teamScores.blue ||
          prev.flags.red.state !== snap.flags.red.state ||
          prev.flags.blue.state !== snap.flags.blue.state ||
          localPrev?.hp !== localNext?.hp ||
          localPrev?.ammo !== localNext?.ammo ||
          localPrev?.alive !== localNext?.alive ||
          localPrev?.kills !== localNext?.kills ||
          localPrev?.deaths !== localNext?.deaths ||
          localPrev?.score !== localNext?.score ||
          (localPrev?.activePowerUps.length ?? 0) !== (localNext?.activePowerUps.length ?? 0) ||
          now - lastHudSyncAtRef.current >= 100;

        if (changedDiscrete) {
          lastHudSnapRef.current = snap;
          lastHudSyncAtRef.current = now;
          setSnapshot(snap);
        }
      },
      onShotFired: ({ projectile, shooterId, aimAngle }) => {
        sceneRef.current?.onShotFired(projectile, shooterId, aimAngle);
        if (shooterId === networkClient.playerId) {
          soundManager.playFire(projectile.isDoubleDamage);
        }
      },
      onProjectileImpact: ({ x, y, hitTankId, blocked }) => {
        sceneRef.current?.onProjectileImpact(x, y, hitTankId, blocked);
        if (hitTankId === networkClient.playerId) {
          soundManager.playImpact(true);
        }
      },
      onTankKilled: ({ killFeed: kf, x, y }) => {
        sceneRef.current?.onTankKilled(x, y, kf.killerId, kf.victimId);
        if (
          kf.killerId === networkClient.playerId ||
          kf.victimId === networkClient.playerId
        ) {
          soundManager.playDestruction();
        }
        setKillFeed((prev) => [kf, ...prev].slice(0, 5));
      },
      onCrateSpawned: (crate) => {
        sceneRef.current?.onCrateSpawned(crate);
      },
      onCrateCollected: ({ powerUp, collectorId, x, y }) => {
        sceneRef.current?.onCrateCollected(x, y, powerUp);
        if (collectorId === networkClient.playerId) {
          soundManager.playPowerUp();
        }
      },
      onAmmoRefilled: () => {
        soundManager.playAmmoRefill();
      },
      onFlagEvent: (ev) => {
        if (ev.type === 'capture') {
          soundManager.playFlagCapture();
        } else if (ev.type === 'pickup' || ev.type === 'return') {
          soundManager.playFlagPickup();
        }
        setFlagBanner(ev);
        setTimeout(() => {
          setFlagBanner((cur) => (cur?.timestamp === ev.timestamp ? null : cur));
        }, 3200);
      },
      onMatchEnded: (result) => {
        setMatchResult(result);
        setShellState('gameover');
        soundManager.playVictory();
      },
      onReturnedToLobby: (lobbyRoom) => {
        setRoom(lobbyRoom);
        setSnapshot(null);
        setMatchResult(null);
        setShellState('lobby');
        sceneRef.current?.enterAttractMode(lobbyRoom.mapId);
      },
      onPlayerDisconnected: ({ nickname: goneName, temporary, reason }) => {
        if (temporary) {
          showTempDisconnect(`${goneName} disconnected (waiting for reconnect)...`);
        } else {
          showTempDisconnect(
            `${goneName} ${reason === 'timeout' ? 'timed out' : 'left the room'}.`
          );
        }
      },
      onPlayerReconnected: ({ nickname: backName }) => {
        showTempDisconnect(`${backName} reconnected.`);
      },
    });

    networkClient.connect();

    const handleResumeSync = () => {
      if (document.visibilityState === 'visible') {
        void networkClient.syncCurrentRoom();
      }
    };
    const handleOnline = () => {
      void networkClient.syncCurrentRoom();
    };
    document.addEventListener('visibilitychange', handleResumeSync);
    window.addEventListener('online', handleOnline);

    // Support ?autostart=1 for immediate testing/play
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      (async () => {
        const res = await networkClient.createRoom('Commander', customSettings);
        if (res.ok) {
          setRoom(res.room);
          networkClient.startMatch(false);
        }
      })();
    }

    const pingTimer = window.setInterval(() => {
      networkClient.measurePing((ms) => setPingMs(ms));
    }, 2000);

    return () => {
      window.clearInterval(pingTimer);
      document.removeEventListener('visibilitychange', handleResumeSync);
      window.removeEventListener('online', handleOnline);
      phaserGameRef.current?.destroy(true);
      phaserGameRef.current = null;
      sceneRef.current = null;
    };
  }, [showTempDisconnect, syncToRoomState]);

  // Global keyboard shortcuts (Tab leaderboard, M mute, Esc/P pause)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.code === 'KeyM') {
        setPreferences((prev) => ({ ...prev, muted: !prev.muted }));
      } else if (e.code === 'Tab' && shellStateRef.current === 'playing') {
        e.preventDefault();
        setShowLeaderboard((prev) => !prev);
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        if (showSettings) {
          setShowSettings(false);
        } else if (shellStateRef.current === 'playing') {
          setShellState('paused');
        } else if (shellStateRef.current === 'paused') {
          setShellState('playing');
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showSettings]);

  const handleNicknameChange = (name: string) => {
    setNickname(name);
    window.localStorage.setItem('iron_orbit_nick', name);
  };

  const handleCreateRoom = async () => {
    const clean = nickname.trim();
    if (!clean) {
      setError('Please enter a pilot callsign first.');
      return;
    }
    setError(null);
    setBusy(true);
    const res = await networkClient.createRoom(clean, customSettings);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setRoom(res.room);
    setShellState('lobby');
    sceneRef.current?.enterAttractMode(res.room.mapId);
  };

  const handleJoinRoom = async (code: string) => {
    const cleanNick = nickname.trim();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanNick) {
      setError('Please enter a pilot callsign first.');
      return;
    }
    if (!cleanCode) {
      setError('Please enter a room code to join.');
      return;
    }
    setError(null);
    setBusy(true);
    const res = await networkClient.joinRoom(cleanCode, cleanNick);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setReconnecting(false);
    syncToRoomState(res.room, res.snapshot, res.matchResult);
  };

  const handleLeaveRoom = () => {
    networkClient.leaveRoom();
    setReconnecting(false);
    setRoom(null);
    setSnapshot(null);
    setMatchResult(null);
    setShowSettings(false);
    setShellState('title');
    sceneRef.current?.enterAttractMode('industrial');
  };

  const handleChangeMode = (mode: GameMode) => {
    networkClient.updateRoomConfig({ mode });
  };

  const handleChangeMap = (mapId: MapId) => {
    networkClient.updateRoomConfig({ mapId });
    sceneRef.current?.enterAttractMode(mapId);
  };

  const handleRerollMap = () => {
    networkClient.updateRoomConfig({ rerollMap: true });
  };

  const handleSwitchTeam = (team: 'red' | 'blue') => {
    networkClient.switchTeam(team);
  };

  const handleStartMatch = () => {
    networkClient.startMatch(false);
  };

  const handlePlayAgain = () => {
    networkClient.startMatch(true);
  };

  const handleReturnToLobby = () => {
    networkClient.returnToLobby();
  };

  const handleSaveGameSettings = (nextSettings: GameSettings) => {
    setCustomSettings(nextSettings);
    if (room && room.hostId === networkClient.playerId && room.status === 'lobby') {
      networkClient.updateRoomConfig({ settings: nextSettings });
    }
  };

  const handlePatchRoomSettings = (patch: Partial<GameSettings>) => {
    setCustomSettings((prev) => ({ ...prev, ...patch }));
    if (room && room.hostId === networkClient.playerId && room.status === 'lobby') {
      networkClient.updateRoomConfig({ settings: patch });
    }
  };

  const handleSetBots = async (count: number, difficulty: BotDifficulty) => {
    setBotsError(null);
    const res = await networkClient.setBots(count, difficulty);
    if (!res.ok) {
      setBotsError(res.error);
    }
  };

  const isHost = Boolean(room && room.hostId === networkClient.playerId);
  const canEditMatchRules =
    shellState === 'title' || (shellState === 'lobby' && isHost);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0b0f14]">
      {/* Isolated Phaser 3 Viewport */}
      <div
        ref={phaserMountRef}
        data-testid="arena-canvas"
        className="fixed inset-0 z-0"
      />

      {versionMismatch && (
        <div
          data-testid="version-mismatch"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0f14]/95 p-6"
        >
          <div className="max-w-sm w-full bg-[#111720] border border-amber-500/40 rounded-xl p-6 text-center space-y-4 shadow-2xl">
            <h2 className="font-display font-bold text-xl text-slate-100">New version available</h2>
            <p className="text-sm text-slate-400">
              The game was updated. Refresh the page to keep playing with everyone else.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {shellState === 'title' && (
        <TitleScreen
          nickname={nickname}
          onNicknameChange={handleNicknameChange}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onOpenSettings={() => setShowSettings(true)}
          error={error}
          busy={busy}
        />
      )}

      {shellState === 'lobby' && room && (
        <RoomLobby
          room={room}
          localPlayerId={networkClient.playerId}
          pingMs={pingMs}
          onStartMatch={handleStartMatch}
          onLeaveRoom={handleLeaveRoom}
          onChangeMode={handleChangeMode}
          onChangeMap={handleChangeMap}
          onRerollMap={handleRerollMap}
          onToggleBetaMaps={(enabled) => networkClient.updateRoomConfig({ includeBetaMaps: enabled })}
          onSwitchTeam={handleSwitchTeam}
          onPatchSettings={handlePatchRoomSettings}
          onSetBots={handleSetBots}
          onOpenSettings={() => setShowSettings(true)}
          botsError={botsError}
          disconnectNotice={
            reconnecting
              ? 'Connection interrupted — reconnecting to lobby...'
              : disconnectNotice
          }
        />
      )}

      {(shellState === 'playing' || shellState === 'paused') && room && (
        <GameHud
          snapshot={snapshot}
          localPlayerId={networkClient.playerId}
          pingMs={pingMs}
          showLeaderboard={showLeaderboard && shellState === 'playing'}
          killFeed={killFeed}
          flagBanner={flagBanner}
          envStatus={envStatus}
          disconnectNotice={
            reconnecting
              ? 'Connection interrupted — reconnecting to match...'
              : disconnectNotice
          }
        />
      )}

      {shellState === 'paused' && room && (
        <PauseModal
          roomCode={room.code}
          mode={room.mode}
          mapId={snapshot?.mapId ?? room.mapId}
          pingMs={pingMs}
          muted={preferences.muted}
          snapshot={snapshot}
          localPlayerId={networkClient.playerId}
          onResume={() => setShellState('playing')}
          onToggleMute={() =>
            setPreferences((prev) => ({ ...prev, muted: !prev.muted }))
          }
          onToggleLeaderboard={() => {
            setShowLeaderboard((prev) => !prev);
            setShellState('playing');
          }}
          onOpenSettings={() => setShowSettings(true)}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      {shellState === 'gameover' && matchResult && (
        <MatchResultsModal
          result={matchResult}
          localPlayerId={networkClient.playerId}
          isHost={isHost}
          onPlayAgain={handlePlayAgain}
          onReturnToLobby={handleReturnToLobby}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      {showSettings && (
        <SettingsModal
          preferences={preferences}
          gameSettings={room ? room.settings : customSettings}
          canEditMatchRules={canEditMatchRules}
          onSavePreferences={setPreferences}
          onSaveGameSettings={handleSaveGameSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </main>
  );
}
