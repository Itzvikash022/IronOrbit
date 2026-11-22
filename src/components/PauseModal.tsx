import React from 'react';
import {
  Play,
  Settings,
  LogOut,
  Volume2,
  VolumeX,
  Trophy,
  Wifi,
} from 'lucide-react';
import { ARENA_MAPS } from '../shared/maps';
import {
  GameMode,
  MatchSnapshot,
  gameModeLabel,
} from '../shared/types';

interface PauseModalProps {
  roomCode: string;
  mode: GameMode;
  mapId: MatchSnapshot['mapId'] | string;
  pingMs: number | null;
  muted: boolean;
  snapshot: MatchSnapshot | null;
  localPlayerId: string;
  onResume: () => void;
  onToggleMute: () => void;
  onToggleLeaderboard: () => void;
  onOpenSettings: () => void;
  onLeaveRoom: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  roomCode,
  mode,
  mapId,
  pingMs,
  muted,
  snapshot,
  localPlayerId,
  onResume,
  onToggleMute,
  onToggleLeaderboard,
  onOpenSettings,
  onLeaveRoom,
}) => {
  const map = ARENA_MAPS[mapId as keyof typeof ARENA_MAPS];
  const localTank = snapshot?.tanks.find((t) => t.id === localPlayerId);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#0b0f14]/80">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-title"
        className="w-full max-w-md bg-[#111720] border border-slate-700 rounded-xl p-6 shadow-2xl space-y-5"
      >
        <div className="text-center">
          <h2
            id="pause-title"
            className="font-display font-extrabold text-3xl text-slate-100 tracking-wide"
          >
            Match Menu
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Match keeps running for everyone else
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs bg-[#0b0f14] border border-slate-800 rounded-lg p-3">
          <div>
            <div className="text-slate-500 uppercase tracking-wider text-[10px]">Room</div>
            <div className="font-mono-num font-bold text-amber-400 tracking-widest">
              {roomCode}
            </div>
          </div>
          <div>
            <div className="text-slate-500 uppercase tracking-wider text-[10px]">Ping</div>
            <div
              className={`font-mono-num font-semibold inline-flex items-center gap-1 ${
                pingMs === null
                  ? 'text-slate-400'
                  : pingMs <= 80
                    ? 'text-emerald-400'
                    : pingMs <= 160
                      ? 'text-amber-400'
                      : 'text-red-400'
              }`}
            >
              <Wifi className="w-3 h-3" />
              {pingMs === null ? '-- ms' : `${pingMs} ms`}
            </div>
          </div>
          <div>
            <div className="text-slate-500 uppercase tracking-wider text-[10px]">Mode</div>
            <div className="font-semibold text-slate-200">{gameModeLabel(mode)}</div>
          </div>
          <div>
            <div className="text-slate-500 uppercase tracking-wider text-[10px]">Arena</div>
            <div className="font-semibold text-slate-200 truncate">
              {map?.name ?? String(mapId)}
            </div>
          </div>
          {localTank && (
            <>
              <div>
                <div className="text-slate-500 uppercase tracking-wider text-[10px]">
                  Your Record
                </div>
                <div className="font-mono-num text-slate-200">
                  {localTank.kills}K / {localTank.deaths}D · {localTank.score} pts
                </div>
              </div>
              <div>
                <div className="text-slate-500 uppercase tracking-wider text-[10px]">
                  Controls
                </div>
                <div className="text-slate-300 leading-snug">
                  Space drive · Click fire · Tab board
                </div>
              </div>
            </>
          )}
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-lg tracking-wide cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume Match</span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-semibold text-slate-200 cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            <span>{muted ? 'Unmute Sound' : 'Mute Sound'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleLeaderboard}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-semibold text-slate-200 cursor-pointer"
          >
            <Trophy className="w-4 h-4" />
            <span>Toggle Leaderboard</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-semibold text-slate-200 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

          <button
            type="button"
            onClick={onLeaveRoom}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-red-950/70 border border-slate-800 hover:border-red-800 text-sm font-semibold text-slate-300 hover:text-red-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Room</span>
          </button>
        </div>
      </div>
    </div>
  );
};
