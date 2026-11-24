import React from 'react';
import { Lock, Play, Settings } from 'lucide-react';
import { IronOrbitLogo } from './PowerUpSvgIcon';
import { PLATFORM_GAMES, type PlatformGame } from '../shared/games';

interface HomeScreenProps {
  onSelectIronOrbit: () => void;
  onOpenSettings: () => void;
}

function GameCard({
  game,
  onPlay,
}: {
  game: PlatformGame;
  onPlay?: () => void;
}) {
  const live = game.status === 'live';
  return (
    <article
      className={`rounded-xl border shadow-2xl overflow-hidden transition ${
        live
          ? 'border-slate-600/80 bg-[#111720]/95 hover:border-amber-500/50'
          : 'border-slate-800/80 bg-[#0d1219]/90 opacity-70'
      }`}
    >
      <div className="px-5 pt-5 pb-3 border-b border-slate-800/80 bg-[#0d1219]">
        {game.id === 'iron-orbit' ? (
          <IronOrbitLogo className="w-44 h-auto" />
        ) : (
          <h2 className="font-display text-2xl tracking-wide text-slate-200 uppercase">
            {game.title}
          </h2>
        )}
      </div>
      <div className="p-5 space-y-4">
        <p className="text-sm text-slate-400 leading-relaxed">{game.tagline}</p>
        {live ? (
          <button
            type="button"
            data-testid="play-iron-orbit"
            onClick={onPlay}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm tracking-wide uppercase px-4 py-2.5 transition"
          >
            <Play className="w-4 h-4" />
            Enter
          </button>
        ) : (
          <div className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-400 font-display font-bold text-sm tracking-wide uppercase px-4 py-2.5">
            <Lock className="w-4 h-4" />
            Coming soon
          </div>
        )}
      </div>
    </article>
  );
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectIronOrbit,
  onOpenSettings,
}) => {
  return (
    <div className="fixed inset-0 z-20 overflow-y-auto bg-[#0b0f14]">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse at 20% 0%, rgba(245,158,11,0.12), transparent 45%), radial-gradient(ellipse at 80% 100%, rgba(56,189,248,0.08), transparent 40%)',
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 lg:px-16 pt-8 pb-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-500 mb-1">
            Arena Collective
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-slate-100 tracking-wide uppercase">
            Play Hub
          </h1>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm px-3 py-2 transition"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </header>

      <main className="relative z-10 px-6 sm:px-10 lg:px-16 pb-16 pt-4">
        <p className="text-sm text-slate-400 max-w-xl mb-8">
          Pick a game to jump in. Shared series scoring and tournament lobbies will land here later —
          for now, Iron Orbit is ready.
        </p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl">
          {PLATFORM_GAMES.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onPlay={game.id === 'iron-orbit' ? onSelectIronOrbit : undefined}
            />
          ))}
        </div>
      </main>
    </div>
  );
};
