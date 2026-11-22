import React, { useState } from 'react';
import {
  Copy,
  Check,
  Shuffle,
  Play,
  LogOut,
  Settings,
  Shield,
  Swords,
  Users,
  Crown,
  Target,
  Clock,
  Wifi,
  Bot,
} from 'lucide-react';
import { ARENA_MAPS, BETA_MAP_IDS, CLASSIC_MAP_IDS } from '../shared/maps';
import {
  BOT_DIFFICULTIES,
  BotDifficulty,
  botDifficultyLabel,
  GameMode,
  GameSettings,
  MapId,
  RoomInfo,
  isTeamMode,
} from '../shared/types';

interface RoomLobbyProps {
  room: RoomInfo;
  localPlayerId: string;
  pingMs: number | null;
  onStartMatch: () => void;
  onLeaveRoom: () => void;
  onChangeMode: (mode: GameMode) => void;
  onChangeMap: (mapId: MapId) => void;
  onRerollMap: () => void;
  onToggleBetaMaps: (enabled: boolean) => void;
  onSwitchTeam: (team: 'red' | 'blue') => void;
  onPatchSettings: (patch: Partial<GameSettings>) => void;
  onSetBots: (count: number, difficulty: BotDifficulty) => void;
  onOpenSettings: () => void;
  disconnectNotice: string | null;
  botsError?: string | null;
}

function mapMechanicsHint(id: MapId): string {
  switch (id) {
    case 'dunes':
      return 'Sand patches slow your tank to a crawl. Patches move every match.';
    case 'glacier':
      return 'Ice sheets make you skid. Patches move every match.';
    case 'magma':
      return 'Lava pools burn anything that sits in them. Pools move every match.';
    case 'storm':
      return 'Wind gusts bend shells - even back toward you.';
    case 'sentinel':
      return 'Wall turrets fire on enemies (everyone in FFA / Team DM; only the other team in CTF).';
    case 'overgrowth':
      return 'Tall grass hides tanks until they shoot or get close.';
    case 'blastyard':
      return 'Random stun bombs - watch the red warning rings.';
    default:
      return '';
  }
}

export const RoomLobby: React.FC<RoomLobbyProps> = ({
  room,
  localPlayerId,
  pingMs,
  onStartMatch,
  onLeaveRoom,
  onChangeMode,
  onChangeMap,
  onRerollMap,
  onToggleBetaMaps,
  onSwitchTeam,
  onPatchSettings,
  onSetBots,
  onOpenSettings,
  disconnectNotice,
  botsError = null,
}) => {
  const [copied, setCopied] = useState(false);
  const botCount = room.players.filter((p) => p.isBot).length;
  const humanCount = room.players.length - botCount;
  const botsBlockedByCtf = room.mode === 'ctf' && humanCount >= 2;
  const botDifficulty = room.botDifficulty ?? 'player';
  const isHost = room.hostId === localPlayerId;
  const currentMap = ARENA_MAPS[room.mapId];
  const includeBeta = Boolean(room.includeBetaMaps);
  const terrainIds = BETA_MAP_IDS.filter((id) => ARENA_MAPS[id].category === 'terrain');
  const obstacleIds = BETA_MAP_IDS.filter((id) => ARENA_MAPS[id].category === 'obstacle');
  const localPlayer = room.players.find((p) => p.id === localPlayerId);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(room.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4 sm:p-8 bg-[#0b0f14]/80">
      <div className="w-full max-w-4xl bg-[#111720] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Lobby Header */}
        <div className="px-6 py-4 bg-[#0d1219] border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl tracking-wide text-slate-100">
              Staging Lobby
            </h1>
            <p className="text-xs text-slate-400">
              Share the room code with friends to join this match
            </p>
          </div>

          <div className="flex items-center gap-3">
            {pingMs !== null && (
              <div
                data-testid="lobby-ping"
                className={`hidden sm:inline-flex h-9 items-center gap-1.5 bg-[#0b0f14] border border-slate-700 rounded-lg px-2.5 text-xs font-mono-num font-semibold leading-none tabular-nums ${
                  pingMs <= 80
                    ? 'text-emerald-400'
                    : pingMs <= 160
                      ? 'text-amber-400'
                      : 'text-red-400'
                }`}
              >
                <Wifi className="w-3.5 h-3.5 shrink-0" />
                <span className="leading-none">{pingMs}&nbsp;ms</span>
              </div>
            )}

            <div className="flex items-center gap-2 bg-[#0b0f14] border border-slate-700 rounded-lg px-3.5 py-2">
              <span className="text-xs text-slate-400 font-medium">Room Code</span>
              <span
                data-testid="lobby-room-code"
                className="font-mono-num font-bold text-lg text-amber-400 tracking-widest"
              >
                {room.code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                aria-label="Copy room code"
                className="ml-1 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>

            <button
              type="button"
              onClick={onLeaveRoom}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-red-950/70 border border-slate-700 hover:border-red-800 text-xs font-semibold text-slate-300 hover:text-red-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" />
              <span>Leave Room</span>
            </button>
          </div>
        </div>

        {disconnectNotice && (
          <div className="px-6 py-2 bg-amber-950/50 border-b border-amber-800/60 text-xs text-amber-200">
            {disconnectNotice}
          </div>
        )}

        {/* Lobby Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Mode, Map & Rules */}
          <div className="md:col-span-5 space-y-5">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Game Mode
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={!isHost}
                  onClick={() => onChangeMode('deathmatch')}
                  className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg border text-xs sm:text-sm font-semibold transition-colors ${
                    room.mode === 'deathmatch'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                      : 'bg-[#0b0f14] border-slate-800 text-slate-400 hover:text-slate-200'
                  } ${isHost ? 'cursor-pointer' : 'cursor-default opacity-90'}`}
                >
                  <Swords className="w-4 h-4 shrink-0" />
                  <span>FFA</span>
                </button>
                <button
                  type="button"
                  disabled={!isHost}
                  onClick={() => onChangeMode('tdm')}
                  className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg border text-xs sm:text-sm font-semibold transition-colors ${
                    room.mode === 'tdm'
                      ? 'bg-violet-500/15 border-violet-500 text-violet-300'
                      : 'bg-[#0b0f14] border-slate-800 text-slate-400 hover:text-slate-200'
                  } ${isHost ? 'cursor-pointer' : 'cursor-default opacity-90'}`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Team DM</span>
                </button>
                <button
                  type="button"
                  disabled={!isHost}
                  onClick={() => onChangeMode('ctf')}
                  className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg border text-xs sm:text-sm font-semibold transition-colors ${
                    room.mode === 'ctf'
                      ? 'bg-sky-500/15 border-sky-500 text-sky-300'
                      : 'bg-[#0b0f14] border-slate-800 text-slate-400 hover:text-slate-200'
                  } ${isHost ? 'cursor-pointer' : 'cursor-default opacity-90'}`}
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  <span>CTF</span>
                </button>
              </div>

              {/* Sub-mode: Milestone vs Timed */}
              {(() => {
                const usesKillTarget =
                  room.mode === 'deathmatch' || room.mode === 'tdm';
                const activeWinMode = usesKillTarget
                  ? room.settings.dmWinMode
                  : room.settings.ctfWinMode;
                const activeTarget = usesKillTarget
                  ? room.settings.killTarget
                  : room.settings.flagTarget;
                const unitLabel =
                  room.mode === 'ctf'
                    ? 'Flags'
                    : room.mode === 'tdm'
                      ? 'Team Kills'
                      : 'Kills';
                const minTarget = usesKillTarget ? 3 : 1;
                const maxTarget = usesKillTarget ? 99 : 15;
                const stepTarget = 1;

                return (
                  <div className="mt-2.5 bg-[#0b0f14] border border-slate-800 rounded-lg p-2.5 space-y-2">
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        disabled={!isHost}
                        onClick={() =>
                          onPatchSettings(
                            usesKillTarget
                              ? { dmWinMode: 'milestone' }
                              : { ctfWinMode: 'milestone' }
                          )
                        }
                        className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold border transition-colors ${
                          activeWinMode === 'milestone'
                            ? 'bg-emerald-500/15 border-emerald-500/70 text-emerald-300'
                            : 'bg-[#111720] border-slate-800 text-slate-400 hover:text-slate-200'
                        } ${isHost ? 'cursor-pointer' : 'cursor-default opacity-90'}`}
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>
                          First to {activeTarget} {unitLabel}
                        </span>
                      </button>
                      <button
                        type="button"
                        disabled={!isHost}
                        onClick={() =>
                          onPatchSettings(
                            usesKillTarget
                              ? { dmWinMode: 'timed' }
                              : { ctfWinMode: 'timed' }
                          )
                        }
                        className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold border transition-colors ${
                          activeWinMode === 'timed'
                            ? 'bg-amber-500/15 border-amber-500/70 text-amber-300'
                            : 'bg-[#111720] border-slate-800 text-slate-400 hover:text-slate-200'
                        } ${isHost ? 'cursor-pointer' : 'cursor-default opacity-90'}`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Timed Only</span>
                      </button>
                    </div>

                    {isHost && activeWinMode === 'milestone' && (
                      <div className="flex items-center justify-between text-xs px-1 gap-2">
                        <span className="text-slate-400 shrink-0">
                          {usesKillTarget
                            ? room.mode === 'tdm'
                              ? 'Team Kill Target'
                              : 'Kill Milestone Target'
                            : 'Flag Capture Target'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            aria-label={`Decrease ${unitLabel} target`}
                            onClick={() => {
                              const next = Math.max(minTarget, activeTarget - stepTarget);
                              onPatchSettings(
                                usesKillTarget
                                  ? { killTarget: next }
                                  : { flagTarget: next }
                              );
                            }}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={minTarget}
                            max={maxTarget}
                            value={activeTarget}
                            aria-label={`${unitLabel} target`}
                            onChange={(e) => {
                              const raw = Number(e.target.value);
                              if (!Number.isFinite(raw)) return;
                              const next = Math.max(
                                minTarget,
                                Math.min(maxTarget, Math.round(raw))
                              );
                              onPatchSettings(
                                usesKillTarget
                                  ? { killTarget: next }
                                  : { flagTarget: next }
                              );
                            }}
                            className="w-14 h-6 text-center font-mono-num font-bold text-slate-100 bg-[#111720] border border-slate-700 rounded outline-none focus:border-amber-500/70 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            aria-label={`Increase ${unitLabel} target`}
                            onClick={() => {
                              const next = Math.min(maxTarget, activeTarget + stepTarget);
                              onPatchSettings(
                                usesKillTarget
                                  ? { killTarget: next }
                                  : { flagTarget: next }
                              );
                            }}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Map Card */}
            <div className="bg-[#0b0f14] border border-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Arena Map
                </span>
                {isHost && (
                  <button
                    type="button"
                    onClick={onRerollMap}
                    className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Randomize</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-12 h-12 rounded-md border border-slate-700 shrink-0"
                  style={{
                    backgroundColor: currentMap.palette.groundBase,
                    boxShadow: `inset 0 0 0 4px ${currentMap.palette.obstacleFill}`,
                  }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="font-display font-bold text-lg text-slate-100 truncate">
                      {currentMap.name}
                    </div>
                    {currentMap.beta && (
                      <span
                        data-testid="map-beta-badge"
                        className="shrink-0 px-1.5 py-0.5 rounded bg-fuchsia-500/20 border border-fuchsia-400/50 text-[10px] font-bold uppercase tracking-wider text-fuchsia-300"
                      >
                        Beta
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 line-clamp-2">
                    {currentMap.subtitle}
                  </div>
                </div>
              </div>

              {currentMap.beta && (
                <p className="text-[11px] text-fuchsia-300/80 leading-snug mb-1">
                  {mapMechanicsHint(currentMap.id)}
                </p>
              )}

              {isHost && (
                <div className="mt-3">
                  <label htmlFor="lobby-map-select" className="sr-only">
                    Select Arena Map
                  </label>
                  <select
                    id="lobby-map-select"
                    value={room.mapId}
                    onChange={(e) => onChangeMap(e.target.value as MapId)}
                    className="w-full px-3 py-2 rounded-md bg-[#111720] border border-slate-700 text-xs font-medium text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <optgroup label="Classic backgrounds">
                      {CLASSIC_MAP_IDS.map((id) => (
                        <option key={id} value={id}>
                          {ARENA_MAPS[id].name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Terrain themes (Beta)">
                      {terrainIds.map((id) => (
                        <option key={id} value={id}>
                          {ARENA_MAPS[id].name} - Beta
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Obstacle themes (Beta)">
                      {obstacleIds.map((id) => (
                        <option key={id} value={id}>
                          {ARENA_MAPS[id].name} - Beta
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              )}

              <label
                htmlFor="lobby-include-beta"
                className={`mt-3 flex items-center gap-2 text-[11px] text-slate-400 `}
              >
                <input
                  id="lobby-include-beta"
                  type="checkbox"
                  checked={includeBeta}
                  disabled={!isHost}
                  onChange={(e) => onToggleBetaMaps(e.target.checked)}
                  className="accent-fuchsia-500"
                />
                <span>Include beta maps when randomizing</span>
              </label>
            </div>

            {/* Bots */}
            <div className="bg-[#0b0f14] border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-violet-400" />
                  Bots ({botCount}/3)
                </span>
                {botsBlockedByCtf && (
                  <span className="text-[10px] text-amber-400/90 text-right leading-snug">
                    CTF bots are solo-only
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Up to 3 bots. Allowed in FFA / Team DM anytime; CTF only when you are alone in
                the room.
              </p>
              {isHost ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400">Count</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={botsBlockedByCtf && botCount === 0}
                        aria-label="Remove bot"
                        onClick={() => onSetBots(Math.max(0, botCount - 1), botDifficulty)}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer disabled:opacity-40"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-mono-num font-bold text-slate-100">
                        {botCount}
                      </span>
                      <button
                        type="button"
                        disabled={botsBlockedByCtf || botCount >= 3}
                        aria-label="Add bot"
                        onClick={() => onSetBots(Math.min(3, botCount + 1), botDifficulty)}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-400">Difficulty</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {BOT_DIFFICULTIES.map((d) => (
                        <button
                          key={d}
                          type="button"
                          disabled={botsBlockedByCtf && botCount === 0}
                          onClick={() => onSetBots(botCount, d)}
                          className={`px-2 py-1.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer disabled:opacity-40 ${
                            botDifficulty === d
                              ? 'bg-violet-500/20 border-violet-400/70 text-violet-200'
                              : 'bg-[#111720] border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {botDifficultyLabel(d)}
                        </button>
                      ))}
                    </div>
                  </div>
                  {botsError && (
                    <p className="text-[11px] text-amber-300 leading-snug">{botsError}</p>
                  )}
                </>
              ) : (
                <div className="text-xs text-slate-300">
                  {botCount === 0
                    ? 'No bots in this room.'
                    : `${botCount} bot${botCount === 1 ? '' : 's'} · ${botDifficultyLabel(botDifficulty)}`}
                </div>
              )}
            </div>

            {/* Match Rules Summary */}
            <div className="bg-[#0b0f14] border border-slate-800 rounded-lg p-4 text-xs space-y-2">
              <div className="font-semibold uppercase tracking-wider text-slate-400">
                Match Parameters
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Win Condition</span>
                <span className="font-mono-num text-emerald-400 font-semibold">
                  {room.mode === 'ctf'
                    ? room.settings.ctfWinMode === 'milestone'
                      ? `First to ${room.settings.flagTarget} Flags`
                      : `Timed (${Math.round(room.settings.matchDurationSec / 60)} min)`
                    : room.settings.dmWinMode === 'milestone'
                      ? room.mode === 'tdm'
                        ? `First to ${room.settings.killTarget} Team Kills`
                        : `First to ${room.settings.killTarget} Kills`
                      : `Timed (${Math.round(room.settings.matchDurationSec / 60)} min)`}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Time Limit</span>
                <span className="font-mono-num text-slate-100">
                  {Math.round(room.settings.matchDurationSec / 60)} min
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Max Ammo / Reload</span>
                <span className="font-mono-num text-slate-100">
                  {room.settings.maxAmmo} shells · {(room.settings.ammoRegenTimeMs / 1000).toFixed(2).replace(/\.?0+$/, '')}s
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Tank Auto-Rotation</span>
                <span className="font-mono-num text-slate-100">
                  {Math.round((room.settings.tankRotationSpeed * 180) / Math.PI)}°/s
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Active Boost Cap</span>
                <span className="font-mono-num text-slate-100">
                  Max 3 on map
                </span>
              </div>
            </div>
          </div>

          {/* Right: Player Roster */}
          <div className="md:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pilots in Room ({room.players.length}/{room.settings.maxPlayersPerRoom})
              </span>
              {isTeamMode(room.mode) && localPlayer && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSwitchTeam('red')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                      localPlayer.team === 'red'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Join Red
                  </button>
                  <button
                    type="button"
                    onClick={() => onSwitchTeam('blue')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                      localPlayer.team === 'blue'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Join Blue
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 bg-[#0b0f14] border border-slate-800 rounded-lg divide-y divide-slate-800/80 overflow-y-auto max-h-80">
              {room.players.map((p) => (
                <div
                  key={p.id}
                  className="px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-3 h-3 rounded-sm shrink-0 ${
                        p.team === 'red'
                          ? 'bg-red-500'
                          : p.team === 'blue'
                            ? 'bg-blue-500'
                            : 'bg-amber-400'
                      }`}
                    />
                    <span className="text-sm font-semibold text-slate-100 truncate">
                      {p.nickname}
                    </span>
                    {p.id === localPlayerId && (
                      <span className="text-xs text-slate-400">(You)</span>
                    )}
                    {p.isBot && (
                      <span className="text-[10px] uppercase tracking-wide text-violet-300/90 font-semibold">
                        Bot
                      </span>
                    )}
                    {!p.connected && !p.isBot && (
                      <span className="text-xs text-amber-400">Reconnecting...</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
                    {isTeamMode(room.mode) && (
                      <span
                        className={
                          p.team === 'red' ? 'text-red-400 font-semibold' : 'text-blue-400 font-semibold'
                        }
                      >
                        {p.team === 'red' ? 'Red Team' : 'Blue Team'}
                      </span>
                    )}
                    {p.isHost && (
                      <span className="flex items-center gap-1 text-amber-400 font-semibold">
                        <Crown className="w-3.5 h-3.5" />
                        Host
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <p className="text-xs text-slate-400">
                {isHost
                  ? 'You can start immediately or wait for more players to join.'
                  : 'Waiting for the room host to start the match.'}
              </p>

              {isHost && (
                <button
                  type="button"
                  data-start="true"
                  onClick={onStartMatch}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-display font-bold text-lg tracking-wide transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start Match</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
