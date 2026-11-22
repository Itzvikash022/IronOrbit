import React from 'react';
import { ArrowRight, Flag, ShieldCheck, Wifi, Wind, Zap } from 'lucide-react';
import type { ArenaEnvStatus } from '../game/ArenaScene';
import { POWERUP_META } from '../shared/config';
import {
  FlagBannerEvent,
  KillFeedEvent,
  MatchSnapshot,
  TankEntity,
  isTeamMode,
} from '../shared/types';
import { PowerUpSvgIcon } from './PowerUpSvgIcon';

interface GameHudProps {
  snapshot: MatchSnapshot | null;
  localPlayerId: string;
  pingMs: number | null;
  showLeaderboard: boolean;
  killFeed: KillFeedEvent[];
  flagBanner: FlagBannerEvent | null;
  disconnectNotice: string | null;
  envStatus?: ArenaEnvStatus | null;
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
  pingMs,
  showLeaderboard,
  killFeed,
  flagBanner,
  disconnectNotice,
  envStatus = null,
}) => {
  if (!snapshot) return null;

  const localTank: TankEntity | undefined = snapshot.tanks.find(
    (t) => t.id === localPlayerId
  );
  const nowServer = snapshot.serverTime;
  const teamMode = isTeamMode(snapshot.mode);
  const showCtfFlags = snapshot.mode === 'ctf';

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
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3">
      {/* Beta-map environment indicators */}
      {envStatus && (envStatus.windActive || envStatus.windWarning) && (
        <div
          data-testid="hud-wind"
          className={`absolute left-1/2 -translate-x-1/2 top-14 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/45 border border-sky-300/20 text-[10px] font-semibold uppercase tracking-wider text-sky-200/90 `}
        >
          <Wind className="w-3 h-3" />
          <span>{envStatus.windWarning ? 'Gust incoming' : 'Wind'}</span>
          <ArrowRight
            className="w-3.5 h-3.5"
            style={{ transform: `rotate(rad)`, opacity: 0.5 + envStatus.windStrength * 0.5 }}
          />
        </div>
      )}
      {envStatus && envStatus.stunMsLeft > 0 && (
        <div
          data-testid="hud-stun"
          className="absolute left-1/2 -translate-x-1/2 top-1/3 flex flex-col items-center gap-1"
        >
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-yellow-400/20 border border-yellow-300/50 text-yellow-200 font-display font-bold tracking-widest text-sm animate-pulse">
            <Zap className="w-4 h-4" />
            STUNNED
          </div>
          <div className="font-mono-num text-xs text-yellow-100/80">
            {(envStatus.stunMsLeft / 1000).toFixed(1)}s
          </div>
        </div>
      )}

      {/* Top: ping | timer + scores | kill feed */}
      <div className="relative flex items-start justify-between gap-3">
        <div
          data-testid="hud-ping"
          className={`inline-flex items-center gap-1 font-mono-num text-[10px] font-semibold tracking-wide opacity-70 ${
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
          <Wifi className="w-2.5 h-2.5" />
          <span>{pingMs === null ? '--' : `${pingMs}`}</span>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5 text-slate-100/90">
          {teamMode ? (
            <>
              <div className="flex items-center gap-2 min-w-[3.25rem] justify-end">
                {showCtfFlags && (
                  <span className="text-[9px] text-red-300/75 flex items-center gap-0.5 leading-none">
                    <Flag className="w-2.5 h-2.5" />
                    {flagStatusText(snapshot.flags.red.state)}
                  </span>
                )}
                <span
                  data-testid="hud-red-score"
                  className="font-display font-bold text-xl text-red-400 tabular-nums leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
                >
                  {snapshot.teamScores.red}
                </span>
              </div>

              <div className="text-center px-2.5 py-1 rounded-md bg-slate-950/35 border border-white/5">
                <div
                  data-testid="hud-timer"
                  className="font-mono-num font-bold text-[15px] text-slate-50/95 leading-none tracking-wide"
                >
                  {formatTimer(snapshot.timeRemainingSec)}
                </div>
                {snapshot.mode === 'ctf' && snapshot.ctfWinMode === 'milestone' && (
                  <div className="text-[8px] font-semibold uppercase tracking-[0.14em] text-sky-300/75 mt-0.5">
                    First {snapshot.flagTarget}
                  </div>
                )}
                {snapshot.mode === 'tdm' && snapshot.dmWinMode === 'milestone' && (
                  <div className="text-[8px] font-semibold uppercase tracking-[0.14em] text-amber-300/75 mt-0.5">
                    First {snapshot.killTarget}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 min-w-[3.25rem]">
                <span
                  data-testid="hud-blue-score"
                  className="font-display font-bold text-xl text-blue-400 tabular-nums leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
                >
                  {snapshot.teamScores.blue}
                </span>
                {showCtfFlags && (
                  <span className="text-[9px] text-blue-300/75 flex items-center gap-0.5 leading-none">
                    <Flag className="w-2.5 h-2.5" />
                    {flagStatusText(snapshot.flags.blue.state)}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="px-2.5 py-1 rounded-md bg-slate-950/35 border border-white/5">
              <div
                data-testid="hud-timer"
                className="font-mono-num font-bold text-[15px] text-slate-50/95 leading-none tracking-wide"
              >
                {formatTimer(snapshot.timeRemainingSec)}
              </div>
            </div>
          )}

          {localTank && (
            <div className="flex items-center gap-2.5 pl-2.5 ml-0.5 border-l border-white/10 text-[10px] font-mono-num tracking-wide text-slate-300/90">
              <span className="inline-flex items-baseline gap-1">
                <span className="text-slate-500 text-[9px]">K</span>
                <span data-testid="hud-kills" className="text-slate-50 font-semibold">
                  {localTank.kills}
                </span>
              </span>
              <span className="inline-flex items-baseline gap-1">
                <span className="text-slate-500 text-[9px]">D</span>
                <span data-testid="hud-deaths" className="text-slate-100 font-semibold">
                  {localTank.deaths}
                </span>
              </span>
              <span className="inline-flex items-baseline gap-1">
                <span className="text-slate-500 text-[9px]">S</span>
                <span data-testid="hud-score" className="text-amber-300/95 font-semibold">
                  {localTank.score}
                </span>
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 max-w-[40%]">
          {disconnectNotice && (
            <div className="bg-amber-950/70 border border-amber-700/50 rounded px-2 py-1 text-[10px] text-amber-200">
              {disconnectNotice}
            </div>
          )}
          {killFeed.slice(0, 3).map((ev) => (
            <div
              key={ev.id}
              className="text-[10px] text-slate-300/80 flex items-center gap-1"
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
              <span className="text-slate-500">›</span>
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

      {/* Center overlays */}
      <div className="flex flex-col items-center justify-center gap-3 my-auto">
        {flagBanner && (
          <div className="bg-[#0b0f14]/80 border border-amber-400/70 rounded-lg px-5 py-2.5 shadow-xl text-center">
            <div className="font-display font-bold text-lg tracking-wide text-amber-300 uppercase">
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
          <div className="bg-[#0b0f14]/75 border border-red-700/60 rounded-lg px-6 py-3 text-center shadow-xl">
            <div className="font-display font-extrabold text-2xl text-red-400 tracking-wide">
              TANK DESTROYED
            </div>
            <div className="text-sm text-slate-300 mt-1 font-mono-num">
              Respawning in {respawnRemainingSec.toFixed(1)}s
            </div>
          </div>
        )}

        {showLeaderboard && (
          <div className="pointer-events-auto w-full max-w-xl bg-[#0b0f14]/92 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
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
                        row.id === localPlayerId
                          ? 'bg-amber-500/10 text-amber-200'
                          : 'text-slate-200'
                      }
                    >
                      <td className="py-2 px-2 font-mono-num">{row.rank}</td>
                      <td className="py-2 px-2 font-semibold flex items-center gap-2">
                        {teamMode && (
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

      {/* Bottom-left: compact armor / shells */}
      <div className="flex items-end justify-between gap-3">
        {localTank ? (
          <div className="flex flex-col gap-1.5 opacity-55">
            {(localTank.activePowerUps.length > 0 || isInvincible) && (
              <div className="flex flex-wrap items-center gap-1.5">
                {isInvincible && (
                  <div className="border border-amber-400/50 rounded px-2 py-1 flex items-center gap-1 text-[10px] font-semibold text-amber-300/90 bg-[#0b0f14]/35">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Shield</span>
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
                        className="border rounded px-2 py-1 flex items-center gap-1 text-[10px] font-semibold text-slate-100/90 bg-[#0b0f14]/35"
                        style={{ borderColor: meta.color }}
                      >
                        <PowerUpSvgIcon type={p.type} size={12} />
                        <span>{meta.shortLabel}</span>
                        <span className="font-mono-num text-slate-300">{rem.toFixed(1)}s</span>
                      </div>
                    );
                  })}
              </div>
            )}

            <div className="flex items-center gap-3 px-1 py-0.5">
              <div className="w-28">
                <div className="flex items-baseline justify-between mb-0.5">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                    Armor
                  </span>
                  <span
                    data-testid="hud-hp"
                    className="font-display font-bold text-sm text-slate-100 tabular-nums leading-none"
                  >
                    {Math.round(localTank.hp)}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800/70 rounded-full overflow-hidden">
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

              <div>
                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                    Shells
                  </span>
                  <span
                    data-testid="hud-ammo"
                    className="font-mono-num font-bold text-[11px] text-amber-400/90"
                  >
                    {hasInfAmmo ? 'INF' : `${localTank.ammo}/${localTank.maxAmmo}`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: localTank.maxAmmo }).map((_, i) => {
                    const filled = hasInfAmmo || i < localTank.ammo;
                    const recharging = !hasInfAmmo && i === localTank.ammo;
                    return (
                      <div
                        key={i}
                        className={`relative w-2 h-3.5 rounded-[2px] overflow-hidden border ${
                          filled
                            ? 'bg-amber-400/90 border-amber-300/70'
                            : 'bg-slate-800/70 border-slate-700/70'
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

        <div className="hidden sm:block text-[10px] text-slate-400/60">
          Esc Menu · Tab Board · Tap Fire+Flip · Hold Drive
        </div>
      </div>
    </div>
  );
};
