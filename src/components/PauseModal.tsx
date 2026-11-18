import React from 'react';
import { Play, Settings, LogOut } from 'lucide-react';

interface PauseModalProps {
  roomCode: string;
  onResume: () => void;
  onOpenSettings: () => void;
  onLeaveRoom: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  roomCode,
  onResume,
  onOpenSettings,
  onLeaveRoom,
}) => (
  <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#0b0f14]/80">
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
      className="w-full max-w-sm bg-[#111720] border border-slate-700 rounded-xl p-6 shadow-2xl space-y-5"
    >
      <div className="text-center">
        <h2
          id="pause-title"
          className="font-display font-extrabold text-3xl text-slate-100 tracking-wide"
        >
          Match Paused
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Room <span className="font-mono-num text-amber-400">{roomCode}</span> remains active in real time
        </p>
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
