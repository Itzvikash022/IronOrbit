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
  Crown,
} from 'lucide-react';
import { ARENA_MAPS, MAP_IDS } from '../shared/maps';
import { GameMode, MapId, RoomInfo } from '../shared/types';

interface RoomLobbyProps {
  room: RoomInfo;
  localPlayerId: string;
  onStartMatch: () => void;
  onLeaveRoom: () => void;
  onChangeMode: (mode: GameMode) => void;
  onChangeMap: (mapId: MapId) => void;
  onRerollMap: () => void;
  onSwitchTeam: (team: 'red' | 'blue') => void;
  onOpenSettings: () => void;
  disconnectNotice: string | null;
}

export const RoomLobby: React.FC<RoomLobbyProps> = ({
  room,
  localPlayerId,
  onStartMatch,
  onLeaveRoom,
  onChangeMode,
  onChangeMap,
  onRerollMap,
  onSwitchTeam,
  onOpenSettings,
  disconnectNotice,
}) => {
  const [copied, setCopied] = useState(false);
  const isHost = room.hostId === localPlayerId;
  const currentMap = ARENA_MAPS[room.mapId];
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
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!isHost}
                  onClick={() => onChangeMode('deathmatch')}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${
                    room.mode === 'deathmatch'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                      : 'bg-[#0b0f14] border-slate-800 text-slate-400 hover:text-slate-200'
                  } ${isHost ? 'cursor-pointer' : 'cursor-default opacity-90'}`}
                >
                  <Swords className="w-4 h-4" />
                  <span>Deathmatch</span>
                </button>
                <button
                  type="button"
                  disabled={!isHost}
                  onClick={() => onChangeMode('ctf')}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${
                    room.mode === 'ctf'
                      ? 'bg-sky-500/15 border-sky-500 text-sky-300'
                      : 'bg-[#0b0f14] border-slate-800 text-slate-400 hover:text-slate-200'
                  } ${isHost ? 'cursor-pointer' : 'cursor-default opacity-90'}`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Capture Flag</span>
                </button>
              </div>
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
                  <div className="font-display font-bold text-lg text-slate-100 truncate">
                    {currentMap.name}
                  </div>
                  <div className="text-xs text-slate-400 line-clamp-2">
                    {currentMap.subtitle}
                  </div>
                </div>
              </div>

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
                    {MAP_IDS.map((id) => (
                      <option key={id} value={id}>
                        {ARENA_MAPS[id].name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Match Rules Summary */}
            <div className="bg-[#0b0f14] border border-slate-800 rounded-lg p-4 text-xs space-y-2">
              <div className="font-semibold uppercase tracking-wider text-slate-400">
                Match Parameters
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Duration</span>
                <span className="font-mono-num text-slate-100">
                  {Math.round(room.settings.matchDurationSec / 60)} min
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Max Ammo / Reload</span>
                <span className="font-mono-num text-slate-100">
                  {room.settings.maxAmmo} shells · {(room.settings.ammoRegenTimeMs / 1000).toFixed(1)}s
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Tank Auto-Rotation</span>
                <span className="font-mono-num text-slate-100">
                  {Math.round((room.settings.tankRotationSpeed * 180) / Math.PI)}°/s
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Respawn / Shield</span>
                <span className="font-mono-num text-slate-100">
                  {(room.settings.respawnDelayMs / 1000).toFixed(1)}s / {(room.settings.invincibilityDurationMs / 1000).toFixed(1)}s
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
              {room.mode === 'ctf' && localPlayer && (
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
                    {!p.connected && (
                      <span className="text-xs text-amber-400">Reconnecting...</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
                    {room.mode === 'ctf' && (
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
