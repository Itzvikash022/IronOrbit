import React, { useState } from 'react';
import { Settings, Users, Plus, LogIn } from 'lucide-react';
import { IronOrbitLogo } from './PowerUpSvgIcon';

interface TitleScreenProps {
  nickname: string;
  onNicknameChange: (name: string) => void;
  onCreateRoom: () => Promise<void>;
  onJoinRoom: (code: string) => Promise<void>;
  onOpenSettings: () => void;
  error: string | null;
  busy: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  nickname,
  onNicknameChange,
  onCreateRoom,
  onJoinRoom,
  onOpenSettings,
  error,
  busy,
}) => {
  const [roomCode, setRoomCode] = useState('');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    await onCreateRoom();
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    await onJoinRoom(roomCode);
  };

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between pointer-events-none">
      {/* Contrast scrim on left third so live Phaser arena flyover shines on the right */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, rgba(11,15,20,0.94) 0%, rgba(11,15,20,0.82) 38%, rgba(11,15,20,0.22) 100%)',
        }}
      />

      <div className="relative z-10 flex-1 flex items-center px-6 sm:px-14 lg:px-20">
        <div className="w-full max-w-md pointer-events-auto">
          <div className="mb-8">
            <IronOrbitLogo className="w-80 h-auto" />
          </div>

          <div className="bg-[#111720]/95 border border-slate-700/70 rounded-xl p-6 shadow-2xl">
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="guest-nickname"
                  className="block text-xs font-semibold tracking-wider text-slate-300 uppercase mb-1.5"
                >
                  Pilot Callsign
                </label>
                <input
                  id="guest-nickname"
                  type="text"
                  maxLength={18}
                  value={nickname}
                  onChange={(e) => onNicknameChange(e.target.value)}
                  placeholder="Enter nickname..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0b0f14] border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="text-xs font-medium text-red-300 bg-red-950/60 border border-red-800/70 rounded-lg px-3 py-2"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                data-start="true"
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-60 text-slate-950 font-display font-bold text-lg tracking-wide transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                <span>Create Room</span>
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-xs text-slate-400 font-medium">or join match</span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            <form onSubmit={handleJoinSubmit} className="flex gap-2">
              <label htmlFor="join-room-code" className="sr-only">
                Room Code
              </label>
              <input
                id="join-room-code"
                type="text"
                maxLength={8}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="CODE (e.g. K7P2M)"
                className="flex-1 min-w-0 px-3.5 py-2.5 rounded-lg bg-[#0b0f14] border border-slate-700 text-slate-100 placeholder-slate-500 font-mono-num text-sm uppercase tracking-widest focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={busy}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <LogIn className="w-4 h-4" />
                <span>Join Room</span>
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Guest Play · No Account Needed</span>
              </div>
              <button
                type="button"
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Single flat control hint line in bottom safe margin */}
      <footer className="relative z-10 px-6 sm:px-14 lg:px-20 pb-5">
        <p className="text-xs text-slate-300/85 tracking-wide font-medium">
          Space Hold to Drive · Mouse Aim · Left Click Fire · Tab Leaderboard · M Mute · Esc Pause
        </p>
      </footer>
    </div>
  );
};
