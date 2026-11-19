import React from 'react';
import { Trophy, RotateCcw, ArrowLeft, LogOut } from 'lucide-react';
import { ARENA_MAPS } from '../shared/maps';
import { MatchResult } from '../shared/types';

interface MatchResultsModalProps {
  result: MatchResult;
  localPlayerId: string;
  isHost: boolean;
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
  onLeaveRoom: () => void;
}

export const MatchResultsModal: React.FC<MatchResultsModalProps> = ({
  result,
  localPlayerId,
  isHost,
  onPlayAgain,
  onReturnToLobby,
  onLeaveRoom,
}) => {
  const map = ARENA_MAPS[result.mapId];
  const mins = Math.floor(result.durationSec / 60);
  const secs = result.durationSec % 60;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#0b0f14]/85">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="results-title"
        className="w-full max-w-2xl bg-[#111720] border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-5 bg-[#0d1219] border-b border-slate-800 text-center">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-amber-500/15 border border-amber-500/50 text-amber-400 mb-2">
            <Trophy className="w-6 h-6" />
          </div>
          <h2
            id="results-title"
            className="font-display font-extrabold text-3xl text-slate-100 tracking-wide"
          >
            {result.mode === 'ctf'
              ? result.winningTeam === 'red'
                ? 'Red Team Victory'
                : result.winningTeam === 'blue'
                  ? 'Blue Team Victory'
                  : 'Match Draw'
              : `${result.winnerName} Wins`}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {map.name} · {result.mode === 'ctf' ? 'Capture the Flag' : 'Deathmatch'} ·{' '}
            <span className="text-amber-300 font-medium">
              {result.endReason === 'milestone' ? 'Milestone Reached' : 'Time Expired'}
            </span>
          </p>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Summary Stats Strip */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-[#0b0f14] border border-slate-800 rounded-lg py-3 px-2">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">
                Match Duration
              </div>
              <div className="font-mono-num font-bold text-xl text-slate-100 mt-0.5">
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </div>
            </div>
            <div className="bg-[#0b0f14] border border-slate-800 rounded-lg py-3 px-2">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">
                {result.mode === 'ctf' ? 'Team Score' : 'Total Kills'}
              </div>
              <div className="font-mono-num font-bold text-xl text-amber-400 mt-0.5">
                {result.mode === 'ctf'
                  ? `${result.teamScores.red} - ${result.teamScores.blue}`
                  : result.totalKills}
              </div>
            </div>
            <div className="bg-[#0b0f14] border border-slate-800 rounded-lg py-3 px-2">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">
                Total Eliminations
              </div>
              <div className="font-mono-num font-bold text-xl text-slate-200 mt-0.5">
                {result.totalDeaths}
              </div>
            </div>
          </div>

          {/* Final Leaderboard */}
          <div className="bg-[#0b0f14] border border-slate-800 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Pilot</th>
                  <th className="py-2.5 px-3 text-right">Kills</th>
                  <th className="py-2.5 px-3 text-right">Deaths</th>
                  <th className="py-2.5 px-3 text-right">Assists</th>
                  {result.mode === 'ctf' && (
                    <th className="py-2.5 px-3 text-right">Captures</th>
                  )}
                  <th className="py-2.5 px-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {result.leaderboard.map((row) => (
                  <tr
                    key={row.id}
                    className={
                      row.id === localPlayerId
                        ? 'bg-amber-500/10 text-amber-200'
                        : 'text-slate-200'
                    }
                  >
                    <td className="py-2.5 px-3 font-mono-num">{row.rank}</td>
                    <td className="py-2.5 px-3 font-semibold flex items-center gap-2">
                      {result.mode === 'ctf' && (
                        <span
                          className={`w-2.5 h-2.5 rounded-sm ${
                            row.team === 'red' ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                        />
                      )}
                      <span>{row.nickname}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-num">{row.kills}</td>
                    <td className="py-2.5 px-3 text-right font-mono-num">{row.deaths}</td>
                    <td className="py-2.5 px-3 text-right font-mono-num">{row.assists}</td>
                    {result.mode === 'ctf' && (
                      <td className="py-2.5 px-3 text-right font-mono-num">
                        {row.captures}
                      </td>
                    )}
                    <td className="py-2.5 px-3 text-right font-mono-num font-bold text-amber-400">
                      {row.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={onLeaveRoom}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-red-950/70 border border-slate-800 text-xs font-semibold text-slate-300 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Leave Room</span>
            </button>

            {isHost ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onReturnToLobby}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Lobby</span>
                </button>
                <button
                  type="button"
                  data-start="true"
                  onClick={onPlayAgain}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-base tracking-wide cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Play Again</span>
                </button>
              </div>
            ) : (
              <span className="text-xs text-slate-400">
                Waiting for host to start next match...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
