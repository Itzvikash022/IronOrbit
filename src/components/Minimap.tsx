import React, { useEffect, useRef } from 'react';
import { POWERUP_META } from '../shared/config';
import { ARENA_MAPS } from '../shared/maps';
import { MatchSnapshot, TankEntity } from '../shared/types';

interface MinimapProps {
  snapshot: MatchSnapshot;
  localPlayerId: string;
}

const MINIMAP_W = 198;
const MINIMAP_H = 132;

export const Minimap: React.FC<MinimapProps> = ({ snapshot, localPlayerId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const map = ARENA_MAPS[snapshot.mapId];
  const localTank: TankEntity | undefined = snapshot.tanks.find(
    (t) => t.id === localPlayerId
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sx = MINIMAP_W / map.width;
    const sy = MINIMAP_H / map.height;

    ctx.clearRect(0, 0, MINIMAP_W, MINIMAP_H);

    // 1. Arena ground tint
    ctx.fillStyle = map.palette.groundBase;
    ctx.fillRect(0, 0, MINIMAP_W, MINIMAP_H);

    // Subtle dark vignette overlay so bright tank blips pop clearly
    ctx.fillStyle = 'rgba(8, 12, 18, 0.42)';
    ctx.fillRect(0, 0, MINIMAP_W, MINIMAP_H);

    // 2. Solid obstacles
    ctx.fillStyle = map.palette.obstacleFill;
    ctx.strokeStyle = map.palette.obstacleStroke;
    ctx.lineWidth = 1;
    for (const obs of map.obstacles) {
      const rx = Math.round(obs.x * sx);
      const ry = Math.round(obs.y * sy);
      const rw = Math.max(2, Math.round(obs.w * sx));
      const rh = Math.max(2, Math.round(obs.h * sy));
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeRect(rx + 0.5, ry + 0.5, rw - 1, rh - 1);
    }

    // 3. CTF Bases & Flags
    if (snapshot.mode === 'ctf') {
      const drawBase = (bx: number, by: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(bx * sx, by * sy, 7, 0, Math.PI * 2);
        ctx.stroke();
      };
      drawBase(map.redBase.x, map.redBase.y, 'rgba(239, 68, 68, 0.75)');
      drawBase(map.blueBase.x, map.blueBase.y, 'rgba(59, 130, 246, 0.75)');

      const drawFlag = (fx: number, fy: number, color: string, carried: boolean) => {
        if (carried) return;
        ctx.fillStyle = color;
        ctx.fillRect(fx * sx - 2.5, fy * sy - 2.5, 5, 5);
      };
      drawFlag(
        snapshot.flags.red.x,
        snapshot.flags.red.y,
        '#f87171',
        snapshot.flags.red.state === 'carried'
      );
      drawFlag(
        snapshot.flags.blue.x,
        snapshot.flags.blue.y,
        '#60a5fa',
        snapshot.flags.blue.state === 'carried'
      );
    }

    // 4. Supply crates
    for (const crate of snapshot.crates) {
      const meta = POWERUP_META[crate.powerUp];
      ctx.fillStyle = meta?.color ?? '#fbbf24';
      ctx.fillRect(crate.x * sx - 2, crate.y * sy - 2, 4, 4);
    }

    // 5. Camera viewport rectangle (only meaningful if arena exceeds screen size)
    if (localTank && typeof window !== 'undefined') {
      const vw = Math.min(map.width, window.innerWidth);
      const vh = Math.min(map.height, window.innerHeight);
      if (vw < map.width - 4 || vh < map.height - 4) {
        const camX = Math.max(0, Math.min(map.width - vw, localTank.x - vw / 2));
        const camY = Math.max(0, Math.min(map.height - vh, localTank.y - vh / 2));
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.35)';
        ctx.lineWidth = 1;
        ctx.strokeRect(
          Math.round(camX * sx) + 0.5,
          Math.round(camY * sy) + 0.5,
          Math.max(4, Math.round(vw * sx) - 1),
          Math.max(4, Math.round(vh * sy) - 1)
        );
      }
    }

    // 6. Remote tanks (enemies & allies)
    for (const tank of snapshot.tanks) {
      if (!tank.alive || !tank.connected || tank.id === localPlayerId) continue;
      const tx = tank.x * sx;
      const ty = tank.y * sy;
      const isAlly =
        snapshot.mode === 'ctf' && localTank && tank.team === localTank.team;
      const fill =
        snapshot.mode === 'ctf'
          ? tank.team === 'red'
            ? '#ef4444'
            : '#3b82f6'
          : '#ef4444';

      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(tx, ty, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isAlly ? '#e0f2fe' : '#090d16';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // 7. Local player tank + facing direction indicator
    if (localTank && localTank.alive) {
      const lx = localTank.x * sx;
      const ly = localTank.y * sy;
      const fx = Math.cos(localTank.angle);
      const fy = Math.sin(localTank.angle);

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + fx * 8, ly + fy * 8);
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(lx, ly, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
  }, [snapshot, localPlayerId, localTank, map]);

  const enemyCount = snapshot.tanks.filter((t) => {
    if (!t.connected || t.id === localPlayerId) return false;
    if (snapshot.mode === 'ctf' && localTank && t.team === localTank.team) return false;
    return true;
  }).length;

  return (
    <div
      data-testid="hud-minimap"
      className="bg-[#0b0f14]/90 border border-slate-700/80 rounded-xl p-2 shadow-xl"
    >
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 px-0.5">
        <span className="text-slate-300">Radar</span>
        <span className="font-mono-num text-amber-400">
          {enemyCount} {enemyCount === 1 ? 'Enemy' : 'Enemies'}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={MINIMAP_W}
        height={MINIMAP_H}
        className="block w-[156px] h-[104px] sm:w-[198px] sm:h-[132px] rounded border border-slate-800"
      />
    </div>
  );
};
