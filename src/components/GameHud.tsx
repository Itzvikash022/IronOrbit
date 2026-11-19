import React from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  Trophy,
  Settings,
  Flag,
  ShieldCheck,
  Wifi,
} from 'lucide-react';
import { POWERUP_META } from '../shared/config';
import { ARENA_MAPS } from '../shared/maps';
import {
  FlagBannerEvent,
  KillFeedEvent,
  MatchSnapshot,
  TankEntity,
} from '../shared/types';
import { Minimap } from './Minimap';
import { PowerUpSvgIcon } from './PowerUpSvgIcon';

interface GameHudProps {
  snapshot: MatchSnapshot | null;
  localPlayerId: string;
  roomCode: string;
  pingMs: number | null;
  muted: boolean;
  showLeaderboard: boolean;
  killFeed: KillFeedEvent[];
  flagBanner: FlagBannerEvent | null;
  disconnectNotice: string | null;
  onToggleMute: () => void;
  onToggleLeaderboard: () => void;
  onOpenSettings: () => void;
  onPause: () => void;
}

function formatTimer(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function flagStatusText(state: 'at_base' | 'carried' | 'dropped'): string {
  if (state === 'at_base') return 'At Base';
  if (state === 'carried') return 'Taken';
  return 'Dropped';
}

export const GameHud: React.FC<GameHudProps> = ({
  snapshot,
  localPlayerId,
  roomCode,
  pingMs,
  muted,
  showLeaderboard,
  killFeed,
  flagBanner,
  disconnectNotice,
  onToggleMute,
  onToggleLeaderboard,
  onOpenSettings,
  onPause,
}) => {
  if (!snapshot) return null;

  const localTank: TankEntity | undefined = snapshot.tanks.find(
    (t) => t.id === localPlayerId
  );
  const nowServer = snapshot.serverTime;
  const map = ARENA_MAPS[snapshot.mapId];

  const hpPct = localTank
    ? Math.max(0, Math.min(100, Math.round((localTank.hp / localTank.maxHp) * 100)))
    : 0;
  const hasInfAmmo = localTank
    ? localTank.activePowerUps.some(
        (p) => p.type === 'infinite_ammo' && p.expiresAt > nowServer
      )
    : false;
  const isInvincible = localTank ? localTank.invincibleUntil > nowServer : false;
  const respawnRemainingSec =
    localTank && !localTank.alive
      ? Math.max(0, (localTank.respawnAt - nowServer) / 1000)
      : 0;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-4">
      {/* Top Row: Left Map/Room Info | Center Timer & Mode Score | Right K/D & Controls */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left: Map, Room Code & Live Ping */}
        <div className="bg-[#0b0f14]/88 border border-slate-700/70 rounded-lg px-3.5 py-2 shadow-lg">
          <div className="font-display font-bold text-base tracking-wide text-slate-100 leading-tight">
            {map.name}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{snapshot.mode === 'ctf' ? 'Capture the Flag' : 'Deathmatch'}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num text-amber-400 font-semibold">{roomCode}</span>
            <span aria-hidden="true">·</span>
            <span
              data-testid="hud-ping"
              className={`inline-flex items-center gap-1 font-mono-num font-semibold ${
                pingMs === null
                  ? 'text-slate-400'
                  : pingMs <= 80
                    ? 'text-emerald-400'
                    : pingMs <= 160
                      ? 'text-amber-400'
                      : 'text-red-400'
              }`}
              title="Network round-trip latency"
            >
              <Wifi className="w-3 h-3" />
              <span>{pingMs === null ? '-- ms' : `${pingMs} ms`}</span>
            </span>
          </div>
        </div>

        {/* Top-Center: Match Timer, Milestone Target & Mode Score */}
        <div className="bg-[#0b0f14]/90 border border-slate-700/70 rounded-lg px-5 py-2 shadow-lg flex items-center gap-5">
          {snapshot.mode === 'ctf' ? (
            <>
              <div className="flex items-center gap-2.5">
                <div className="text-right">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-red-400">
                    Red
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1">
                    <Flag className="w-3 h-3 text-red-400" />
                    <span>{flagStatusText(snapshot.flags.red.state)}</span>
                  </div>
                </div>
                <div
                  data-testid="hud-red-score"
                  className="font-display font-extrabold text-3xl text-red-400 tabular-nums leading-none"
                >
                  {snapshot.teamScores.red}
                </div>
              </div>

              <div className="px-3 border-x border-slate-800 text-center">
                <div
                  data-testid="hud-timer"
                  className="font-mono-num font-bold text-2xl text-slate-100 leading-none"
                >
                  {formatTimer(snapshot.timeRemainingSec)}
                </div>
                {snapshot.ctfWinMode === 'milestone' && (
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-sky-400 mt-1">
                    First to {snapshot.flagTarget}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <div
                  data-testid="hud-blue-score"
                  className="font-display font-extrabold text-3xl text-blue-400 tabular-nums leading-none"
                >
                  {snapshot.teamScores.blue}
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">
                    Blue
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Flag className="w-3 h-3 text-blue-400" />
                    <span>{flagStatusText(snapshot.flags.blue.state)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-5">
              <div className="text-center">
                <div
                  data-testid="hud-timer"
                  className="font-mono-num font-bold text-2xl text-slate-100 leading-none"
                >
                  {formatTimer(snapshot.timeRemainingSec)}
                </div>
                {snapshot.dmWinMode === 'milestone' && (
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 mt-1">
                    Target {snapshot.killTarget} K
                  </div>
                )}
              </div>
              {snapshot.leaderboard[0] && (
                <div className="pl-4 border-l border-slate-800 text-xs">
                  <div className="text-slate-400">Leader</div>
                  <div className="font-semibold text-amber-400 tabular-nums">
                    {snapshot.leaderboard[0].nickname} · {snapshot.leaderboard[0].kills}
                    {snapshot.dmWinMode === 'milestone' ? `/${snapshot.killTarget}` : ''} K
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top-Right: Player Stats & Utility Buttons */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 pointer-events-auto">
            {localTank && (
              <div className="bg-[#0b0f14]/88 border border-slate-700/70 rounded-lg px-3.5 py-2 flex items-center gap-4 shadow-lg">
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">
                    Kills
                  </div>
                  <div
                    data-testid="hud-kills"
                    className="font-display font-bold text-xl text-slate-100 tabular-nums leading-none"
                  >
                    {localTank.kills}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">
                    Deaths
                  </div>
                  <div
                    data-testid="hud-deaths"
                    className="font-display font-bold text-xl text-slate-300 tabular-nums leading-none"
                  >
                    {localTank.deaths}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">
                    Score
                  </div>
                  <div
                    data-testid="hud-score"
                    className="font-display font-bold text-xl text-amber-400 tabular-nums leading-none"
                  >
                    {localTank.score}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleLeaderboard();
                }}
                aria-label="Toggle Leaderboard (Tab)"
                title="Leaderboard (Tab)"
                className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                  showLeaderboard
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-[#0b0f14]/90 text-slate-200 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <Trophy className="w-4 h-4" />
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleMute();
                }}
                aria-label={muted ? 'Unmute Sound (M)' : 'Mute Sound (M)'}
                title={muted ? 'Unmute (M)' : 'Mute (M)'}
                className="p-2.5 rounded-lg bg-[#0b0f14]/90 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {muted ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onOpenSettings();
                }}
                aria-label="Game Settings"
                title="Settings"
                className="p-2.5 rounded-lg bg-[#0b0f14]/90 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onPause();
                }}
                aria-label="Pause Menu (Esc)"
                title="Pause (Esc)"
                className="p-2.5 rounded-lg bg-[#0b0f14]/90 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Pause className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Kill Feed & Disconnect Notice */}
          {disconnectNotice && (
            <div className="bg-amber-950/90 border border-amber-700/70 rounded px-3 py-1.5 text-xs text-amber-200">
              {disconnectNotice}
            </div>
          )}

          <div className="space-y-1 flex flex-col items-end">
            {killFeed.slice(0, 4).map((ev) => (
              <div
                key={ev.id}
                className="bg-[#0b0f14]/85 border border-slate-800 rounded px-2.5 py-1 text-xs flex items-center gap-1.5"
              >
                <span
                  className={
                    ev.killerTeam === 'red'
                      ? 'text-red-400 font-semibold'
                      : ev.killerTeam === 'blue'
                        ? 'text-blue-400 font-semibold'
                        : 'text-amber-400 font-semibold'
                  }
                >
                  {ev.killerName}
                </span>
                <span className="text-slate-500">eliminated</span>
                <span
                  className={
                    ev.victimTeam === 'red'
                      ? 'text-red-400 font-semibold'
                      : ev.victimTeam === 'blue'
                        ? 'text-blue-400 font-semibold'
                        : 'text-slate-200 font-semibold'
                  }
                >
                  {ev.victimName}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center Banners: CTF Flag Announcement / Respawn Countdown / Collapsible Leaderboard */}
      <div className="flex flex-col items-center justify-center gap-3 my-auto">
        {flagBanner && (
          <div className="bg-[#0b0f14]/95 border-2 border-amber-400 rounded-xl px-6 py-3 shadow-2xl text-center">
            <div className="font-display font-extrabold text-2xl tracking-wide text-amber-300 uppercase">
              {flagBanner.type === 'capture'
                ? `${flagBanner.actorName} Captured the ${flagBanner.flagTeam.toUpperCase()} Flag!`
                : flagBanner.type === 'pickup'
                  ? `${flagBanner.actorName} Took the ${flagBanner.flagTeam.toUpperCase()} Flag!`
                  : flagBanner.type === 'return'
                    ? `${flagBanner.actorName} Returned the ${flagBanner.flagTeam.toUpperCase()} Flag!`
                    : `${flagBanner.flagTeam.toUpperCase()} Flag Dropped!`}
            </div>
          </div>
        )}

        {localTank && !localTank.alive && (
          <div className="bg-[#0b0f14]/92 border border-red-700/80 rounded-xl px-7 py-4 text-center shadow-2xl">
            <div className="font-display font-extrabold text-3xl text-red-400 tracking-wide">
              TANK DESTROYED
            </div>
            <div className="text-sm text-slate-300 mt-1 font-mono-num">
              Respawning in {respawnRemainingSec.toFixed(1)}s
            </div>
          </div>
        )}

        {showLeaderboard && (
          <div className="pointer-events-auto w-full max-w-xl bg-[#0b0f14]/95 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
            <div className="px-4 py-2.5 bg-[#111720] border-b border-slate-800 flex items-center justify-between">
              <span className="font-display font-bold text-lg tracking-wide text-slate-100">
                Live Leaderboard
              </span>
              <span className="text-xs text-slate-400">Press Tab to hide</span>
            </div>
            <div className="p-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="py-1.5 px-2">#</th>
                    <th className="py-1.5 px-2">Pilot</th>
                    <th className="py-1.5 px-2 text-right">Kills</th>
                    <th className="py-1.5 px-2 text-right">Deaths</th>
                    <th className="py-1.5 px-2 text-right">Assists</th>
                    {snapshot.mode === 'ctf' && (
                      <th className="py-1.5 px-2 text-right">Caps</th>
                    )}
                    <th className="py-1.5 px-2 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {snapshot.leaderboard.map((row) => (
                    <tr
                      key={row.id}
                      className={
                        row.id === localPlayerId ? 'bg-amber-500/10 text-amber-200' : 'text-slate-200'
                      }
                    >
                      <td className="py-2 px-2 font-mono-num">{row.rank}</td>
                      <td className="py-2 px-2 font-semibold flex items-center gap-2">
                        {snapshot.mode === 'ctf' && (
                          <span
                            className={`w-2 h-2 rounded-sm ${
                              row.team === 'red' ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                          />
                        )}
                        <span>{row.nickname}</span>
                      </td>
                      <td className="py-2 px-2 text-right font-mono-num">{row.kills}</td>
                      <td className="py-2 px-2 text-right font-mono-num">{row.deaths}</td>
                      <td className="py-2 px-2 text-right font-mono-num">{row.assists}</td>
                      {snapshot.mode === 'ctf' && (
                        <td className="py-2 px-2 text-right font-mono-num">{row.captures}</td>
                      )}
                      <td className="py-2 px-2 text-right font-mono-num font-bold text-amber-400">
                        {row.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Row: Left Health, Ammo & Active Power-Ups */}
      <div className="flex items-end justify-between gap-4">
        {localTank ? (
          <div className="flex flex-col gap-2">
            {/* Active Power-Up Timers */}
            {(localTank.activePowerUps.length > 0 || isInvincible) && (
              <div className="flex flex-wrap items-center gap-2">
                {isInvincible && (
                  <div className="bg-[#0b0f14]/92 border border-amber-400/70 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Spawn Shield</span>
                    <span className="font-mono-num">
                      {Math.max(0, (localTank.invincibleUntil - nowServer) / 1000).toFixed(1)}s
                    </span>
                  </div>
                )}
                {localTank.activePowerUps
                  .filter((p) => p.expiresAt > nowServer)
                  .map((p) => {
                    const meta = POWERUP_META[p.type];
                    const rem = Math.max(0, (p.expiresAt - nowServer) / 1000);
                    return (
                      <div
                        key={p.type}
                        className="bg-[#0b0f14]/92 border rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-100"
                        style={{ borderColor: meta.color }}
                      >
                        <PowerUpSvgIcon type={p.type} size={16} />
                        <span>{meta.label}</span>
                        <span className="font-mono-num text-slate-300">
                          {rem.toFixed(1)}s
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Health & Ammunition Cluster */}
            <div className="bg-[#0b0f14]/90 border border-slate-700/80 rounded-xl px-4 py-3 shadow-xl flex items-center gap-6">
              {/* Armor HP */}
              <div className="w-44">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Armor HP
                  </span>
                  <span
                    data-testid="hud-hp"
                    className="font-display font-bold text-2xl text-slate-100 tabular-nums leading-none"
                  >
                    {Math.round(localTank.hp)}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-150 ${
                      hpPct > 55
                        ? 'bg-emerald-500'
                        : hpPct > 25
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${hpPct}%` }}
                  />
                </div>
              </div>

              {/* Ammo Pips & Recharge Bar */}
              <div className="pl-5 border-l border-slate-800">
                <div className="flex items-baseline justify-between gap-3 mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Shells
                  </span>
                  <span
                    data-testid="hud-ammo"
                    className="font-mono-num font-bold text-sm text-amber-400"
                  >
                    {hasInfAmmo
                      ? 'INF'
                      : `${localTank.ammo}/${localTank.maxAmmo}`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {Array.from({ length: localTank.maxAmmo }).map((_, i) => {
                    const filled = hasInfAmmo || i < localTank.ammo;
                    const recharging = !hasInfAmmo && i === localTank.ammo;
                    return (
                      <div
                        key={i}
                        className={`relative w-3.5 h-6 rounded-sm overflow-hidden border ${
                          filled
                            ? 'bg-amber-400 border-amber-300'
                            : 'bg-slate-800/90 border-slate-700'
                        }`}
                      >
                        {recharging && (
                          <div
                            className="absolute bottom-0 left-0 right-0 bg-amber-500/55"
                            style={{
                              height: `${Math.round(localTank.ammoRegenProgress * 100)}%`,
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div />
        )}

        {/* Bottom-Right Tactical Minimap & Compact Control Hint */}
        <div className="flex flex-col items-end gap-1.5">
          <Minimap snapshot={snapshot} localPlayerId={localPlayerId} />
          <div className="hidden sm:block text-[11px] text-slate-300/75 bg-[#0b0f14]/80 border border-slate-800/70 rounded-lg px-2.5 py-1">
            Space Lock &amp; Drive · Click Shoot &amp; Flip Spin · Tab Leaderboard
          </div>
        </div>
      </div>
    </div>
  );
};
