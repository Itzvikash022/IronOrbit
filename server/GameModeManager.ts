import { SCORING } from '../src/shared/config.ts';
import {
  assignBalancedTeam,
  buildLeaderboard,
  evaluateFlagInteraction,
} from '../src/shared/rules.ts';
import type {
  ArenaMap,
  FlagBannerEvent,
  FlagEntity,
  GameMode,
  MatchResult,
  TankEntity,
  TeamId,
} from '../src/shared/types.ts';

export interface GameModeHandler {
  readonly mode: GameMode;
  assignTeam(existingTanks: TankEntity[]): TeamId;
  onTankKilled(
    victim: TankEntity,
    killer: TankEntity | null,
    assisters: TankEntity[],
    flags: { red: FlagEntity; blue: FlagEntity },
    emitFlagEvent: (ev: FlagBannerEvent) => void,
    nowMs: number
  ): void;
  tick(
    tanks: TankEntity[],
    flags: { red: FlagEntity; blue: FlagEntity },
    map: ArenaMap,
    teamScores: { red: number; blue: number },
    emitFlagEvent: (ev: FlagBannerEvent) => void,
    nowMs: number
  ): void;
  buildMatchResult(
    map: ArenaMap,
    durationSec: number,
    tanks: TankEntity[],
    teamScores: { red: number; blue: number }
  ): MatchResult;
}

class DeathmatchHandler implements GameModeHandler {
  readonly mode: GameMode = 'deathmatch';

  assignTeam(): TeamId {
    return 'none';
  }

  onTankKilled(
    victim: TankEntity,
    killer: TankEntity | null,
    assisters: TankEntity[]
  ): void {
    victim.deaths += 1;
    if (killer && killer.id !== victim.id) {
      killer.kills += 1;
      killer.score += SCORING.KILL;
    }
    for (const a of assisters) {
      a.assists += 1;
      a.score += SCORING.ASSIST;
    }
  }

  tick(): void {
    // No flag logic in Deathmatch
  }

  buildMatchResult(
    map: ArenaMap,
    durationSec: number,
    tanks: TankEntity[],
    teamScores: { red: number; blue: number }
  ): MatchResult {
    const leaderboard = buildLeaderboard(tanks);
    const top = leaderboard[0];
    const totalKills = tanks.reduce((acc, t) => acc + t.kills, 0);
    const totalDeaths = tanks.reduce((acc, t) => acc + t.deaths, 0);
    return {
      mode: 'deathmatch',
      mapId: map.id,
      durationSec,
      winnerId: top ? top.id : null,
      winnerName: top ? top.nickname : 'No Contest',
      winningTeam: 'none',
      teamScores,
      leaderboard,
      totalKills,
      totalDeaths,
    };
  }
}

class CaptureTheFlagHandler implements GameModeHandler {
  readonly mode: GameMode = 'ctf';

  assignTeam(existingTanks: TankEntity[]): TeamId {
    return assignBalancedTeam(existingTanks);
  }

  onTankKilled(
    victim: TankEntity,
    killer: TankEntity | null,
    assisters: TankEntity[],
    flags: { red: FlagEntity; blue: FlagEntity },
    emitFlagEvent: (ev: FlagBannerEvent) => void,
    nowMs: number
  ): void {
    victim.deaths += 1;
    if (killer && killer.id !== victim.id) {
      killer.kills += 1;
      killer.score += SCORING.KILL;
    }
    for (const a of assisters) {
      a.assists += 1;
      a.score += SCORING.ASSIST;
    }

    // Drop carried flag at elimination location
    if (victim.carryingFlag === 'red' || victim.carryingFlag === 'blue') {
      const droppedTeam: 'red' | 'blue' = victim.carryingFlag;
      const flag = flags[droppedTeam];
      flag.state = 'dropped';
      flag.x = victim.x;
      flag.y = victim.y;
      flag.carrierId = null;
      victim.carryingFlag = 'none';

      emitFlagEvent({
        type: 'drop',
        flagTeam: droppedTeam,
        actorName: victim.nickname,
        actorTeam: victim.team,
        timestamp: nowMs,
      });
    }
  }

  tick(
    tanks: TankEntity[],
    flags: { red: FlagEntity; blue: FlagEntity },
    map: ArenaMap,
    teamScores: { red: number; blue: number },
    emitFlagEvent: (ev: FlagBannerEvent) => void,
    nowMs: number
  ): void {
    // Sync carried flag coordinates with carrier tank
    for (const key of ['red', 'blue'] as const) {
      const flag = flags[key];
      if (flag.state === 'carried' && flag.carrierId) {
        const carrier = tanks.find((t) => t.id === flag.carrierId);
        if (carrier && carrier.alive && carrier.connected) {
          flag.x = carrier.x;
          flag.y = carrier.y;
        } else {
          flag.state = 'dropped';
          flag.carrierId = null;
          if (carrier) carrier.carryingFlag = 'none';
        }
      }
    }

    const bases = { red: map.redBase, blue: map.blueBase };
    for (const tank of tanks) {
      if (!tank.alive || !tank.connected) continue;
      const res = evaluateFlagInteraction(tank, flags, bases);
      if (res.event === 'pickup') {
        emitFlagEvent({
          type: 'pickup',
          flagTeam: res.flagTeam,
          actorName: tank.nickname,
          actorTeam: tank.team,
          timestamp: nowMs,
        });
      } else if (res.event === 'return') {
        emitFlagEvent({
          type: 'return',
          flagTeam: res.flagTeam,
          actorName: tank.nickname,
          actorTeam: tank.team,
          timestamp: nowMs,
        });
      } else if (res.event === 'capture') {
        const scoringTeam: 'red' | 'blue' = res.scoringTeam;
        teamScores[scoringTeam] += 1;
        emitFlagEvent({
          type: 'capture',
          flagTeam: res.flagTeam,
          actorName: tank.nickname,
          actorTeam: tank.team,
          timestamp: nowMs,
        });
      }
    }
  }

  buildMatchResult(
    map: ArenaMap,
    durationSec: number,
    tanks: TankEntity[],
    teamScores: { red: number; blue: number }
  ): MatchResult {
    let winningTeam: TeamId = 'none';
    if (teamScores.red > teamScores.blue) winningTeam = 'red';
    else if (teamScores.blue > teamScores.red) winningTeam = 'blue';

    if (winningTeam !== 'none') {
      for (const t of tanks) {
        if (t.team === winningTeam) {
          t.score += SCORING.TEAM_WIN_BONUS;
        }
      }
    }

    const leaderboard = buildLeaderboard(tanks);
    const totalKills = tanks.reduce((acc, t) => acc + t.kills, 0);
    const totalDeaths = tanks.reduce((acc, t) => acc + t.deaths, 0);

    const winnerName =
      winningTeam === 'red'
        ? 'Red Team'
        : winningTeam === 'blue'
          ? 'Blue Team'
          : 'Draw Match';

    return {
      mode: 'ctf',
      mapId: map.id,
      durationSec,
      winnerId: leaderboard[0]?.id ?? null,
      winnerName,
      winningTeam,
      teamScores,
      leaderboard,
      totalKills,
      totalDeaths,
    };
  }
}

export function createGameModeHandler(mode: GameMode): GameModeHandler {
  if (mode === 'ctf') return new CaptureTheFlagHandler();
  return new DeathmatchHandler();
}
