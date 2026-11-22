import {
  CRATE_RADIUS,
  PROJECTILE_RADIUS,
  SPEED_BOOST_MULTIPLIER,
  TANK_RADIUS,
} from './config.ts';
import type {
  ArenaMap,
  GameSettings,
  Obstacle,
  ProjectileEntity,
  Rect,
  SupplyCrateEntity,
  TankEntity,
  Vec2,
} from './types.ts';

export function normalizeAngle(angle: number): number {
  let a = angle % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  if (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function distanceSq(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

export function circleIntersectsRect(
  cx: number,
  cy: number,
  radius: number,
  rect: Rect
): boolean {
  const closestX = clamp(cx, rect.x, rect.x + rect.w);
  const closestY = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < radius * radius;
}

export function resolveCircleRect(
  cx: number,
  cy: number,
  radius: number,
  rect: Rect
): Vec2 {
  const closestX = clamp(cx, rect.x, rect.x + rect.w);
  const closestY = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - closestX;
  const dy = cy - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq >= radius * radius) {
    return { x: cx, y: cy };
  }

  // Circle center is inside the rectangle
  if (distSq === 0) {
    const leftPen = cx - rect.x;
    const rightPen = rect.x + rect.w - cx;
    const topPen = cy - rect.y;
    const bottomPen = rect.y + rect.h - cy;
    const minPen = Math.min(leftPen, rightPen, topPen, bottomPen);
    if (minPen === leftPen) return { x: rect.x - radius, y: cy };
    if (minPen === rightPen) return { x: rect.x + rect.w + radius, y: cy };
    if (minPen === topPen) return { x: cx, y: rect.y - radius };
    return { x: cx, y: rect.y + rect.h + radius };
  }

  const dist = Math.sqrt(distSq);
  const overlap = radius - dist;
  return {
    x: cx + (dx / dist) * overlap,
    y: cy + (dy / dist) * overlap,
  };
}

export function resolveCircleArena(
  x: number,
  y: number,
  radius: number,
  map: ArenaMap
): Vec2 {
  let nx = clamp(x, radius, map.width - radius);
  let ny = clamp(y, radius, map.height - radius);

  // Two passes stabilize corner contacts
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < map.obstacles.length; i++) {
      const resolved = resolveCircleRect(nx, ny, radius, map.obstacles[i]);
      nx = resolved.x;
      ny = resolved.y;
    }
    nx = clamp(nx, radius, map.width - radius);
    ny = clamp(ny, radius, map.height - radius);
  }

  return { x: nx, y: ny };
}

export function hasPowerUp(
  tank: Pick<TankEntity, 'activePowerUps'>,
  type: string,
  nowMs: number
): boolean {
  return tank.activePowerUps.some((p) => p.type === type && p.expiresAt > nowMs);
}

/**
 * Cover the viewport with the arena (no black letterbox bars).
 * Wide maps (~21:9) keep almost the full playfield visible on common screens.
 */
export function computeArenaCameraZoom(
  viewportW: number,
  viewportH: number,
  mapW: number,
  mapH: number
): number {
  const vw = Math.max(320, viewportW);
  const vh = Math.max(240, viewportH);
  if (mapW <= 0 || mapH <= 0) return 1;
  return Math.max(vw / mapW, vh / mapH);
}

export interface RotationFlipState {
  pendingClicks: number;
  lastClickAt: number;
}

export function getShootSettleMs(
  settings: Pick<GameSettings, 'fireCooldownMs'>
): number {
  return Math.max(settings.fireCooldownMs, 260);
}

export function registerFireClick(
  flipState: RotationFlipState,
  nowMs: number
): void {
  flipState.pendingClicks += 1;
  flipState.lastClickAt = nowMs;
}

export function stepRotationFlip(
  tank: Pick<TankEntity, 'alive' | 'rotationDir'>,
  flipState: RotationFlipState,
  nowMs: number,
  settings: Pick<GameSettings, 'fireCooldownMs'>
): boolean {
  if (!tank.alive) {
    flipState.pendingClicks = 0;
    return false;
  }
  if (flipState.pendingClicks <= 0) return false;
  if (nowMs - flipState.lastClickAt < getShootSettleMs(settings)) return false;

  const shouldFlip = flipState.pendingClicks % 2 === 1;
  flipState.pendingClicks = 0;
  if (shouldFlip) {
    tank.rotationDir = tank.rotationDir === -1 ? 1 : -1;
    return true;
  }
  return false;
}

export function stepTankMotion(
  tank: Pick<
    TankEntity,
    'x' | 'y' | 'vx' | 'vy' | 'angle' | 'alive' | 'activePowerUps'
  > & { rotationDir?: 1 | -1 },
  thrust: boolean,
  dt: number,
  map: ArenaMap,
  settings: GameSettings,
  nowMs: number
): void {
  if (!tank.alive) {
    tank.vx = 0;
    tank.vy = 0;
    return;
  }

  // Rotate continuously only while stationary; lock angle while Spacebar thrust is held
  if (!thrust) {
    const dir = tank.rotationDir === -1 ? -1 : 1;
    tank.angle = normalizeAngle(tank.angle + settings.tankRotationSpeed * dir * dt);
  }

  const speedMultiplier = hasPowerUp(tank, 'speed', nowMs)
    ? SPEED_BOOST_MULTIPLIER
    : 1;
  const maxSpeed = settings.tankMoveSpeed * speedMultiplier;

  if (thrust) {
    const dirX = Math.cos(tank.angle);
    const dirY = Math.sin(tank.angle);
    const targetVx = dirX * maxSpeed;
    const targetVy = dirY * maxSpeed;

    const dvx = targetVx - tank.vx;
    const dvy = targetVy - tank.vy;
    const dvLen = Math.hypot(dvx, dvy);
    const maxStep = settings.tankAcceleration * dt;

    if (dvLen <= maxStep || dvLen === 0) {
      tank.vx = targetVx;
      tank.vy = targetVy;
    } else {
      tank.vx += (dvx / dvLen) * maxStep;
      tank.vy += (dvy / dvLen) * maxStep;
    }
  } else {
    // Immediate / snappy braking when Spacebar is released
    const speed = Math.hypot(tank.vx, tank.vy);
    const decelStep = settings.tankDeceleration * dt;
    if (speed <= decelStep || speed === 0) {
      tank.vx = 0;
      tank.vy = 0;
    } else {
      const ratio = (speed - decelStep) / speed;
      tank.vx *= ratio;
      tank.vy *= ratio;
    }
  }

  const nextX = tank.x + tank.vx * dt;
  const nextY = tank.y + tank.vy * dt;
  const resolved = resolveCircleArena(nextX, nextY, TANK_RADIUS, map);

  // Zero out velocity component blocked by wall to prevent sticky wall friction
  if (Math.abs(resolved.x - nextX) > 0.01) tank.vx = 0;
  if (Math.abs(resolved.y - nextY) > 0.01) tank.vy = 0;

  tank.x = resolved.x;
  tank.y = resolved.y;
}

export function segmentIntersectsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rect: Rect
): boolean {
  // Liang-Barsky line-segment vs AABB intersection
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;

  const p = [-dx, dx, -dy, dy];
  const q = [
    x1 - rect.x,
    rect.x + rect.w - x1,
    y1 - rect.y,
    rect.y + rect.h - y1,
  ];

  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return t0 <= t1;
}

export function segmentIntersectsCircle(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cx: number,
  cy: number,
  radius: number
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return distanceSq(x1, y1, cx, cy) <= radius * radius;
  }
  const t = clamp(((cx - x1) * dx + (cy - y1) * dy) / lenSq, 0, 1);
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  return distanceSq(closestX, closestY, cx, cy) <= radius * radius;
}

export interface ProjectileStepResult {
  expired: boolean;
  hitWall: boolean;
  hitTankId: string | null;
  impactX: number;
  impactY: number;
}

export function stepProjectile(
  proj: ProjectileEntity,
  dt: number,
  map: ArenaMap,
  tanks: TankEntity[]
): ProjectileStepResult {
  const prevX = proj.x;
  const prevY = proj.y;
  const stepX = proj.vx * dt;
  const stepY = proj.vy * dt;
  const nextX = prevX + stepX;
  const nextY = prevY + stepY;

  proj.distanceTraveled += Math.hypot(stepX, stepY);

  // Check arena boundary
  if (
    nextX < PROJECTILE_RADIUS ||
    nextX > map.width - PROJECTILE_RADIUS ||
    nextY < PROJECTILE_RADIUS ||
    nextY > map.height - PROJECTILE_RADIUS
  ) {
    return {
      expired: true,
      hitWall: true,
      hitTankId: null,
      impactX: clamp(nextX, 0, map.width),
      impactY: clamp(nextY, 0, map.height),
    };
  }

  // Check obstacle hit (expanded slightly by projectile radius)
  for (let i = 0; i < map.obstacles.length; i++) {
    const obs = map.obstacles[i];
    const expanded: Rect = {
      x: obs.x - PROJECTILE_RADIUS,
      y: obs.y - PROJECTILE_RADIUS,
      w: obs.w + PROJECTILE_RADIUS * 2,
      h: obs.h + PROJECTILE_RADIUS * 2,
    };
    if (segmentIntersectsRect(prevX, prevY, nextX, nextY, expanded)) {
      return {
        expired: true,
        hitWall: true,
        hitTankId: null,
        impactX: (prevX + nextX) * 0.5,
        impactY: (prevY + nextY) * 0.5,
      };
    }
  }

  // Check tank hit (excluding owner; friendly fire checked in rules)
  for (let i = 0; i < tanks.length; i++) {
    const tank = tanks[i];
    if (!tank.alive || tank.id === proj.ownerId) continue;
    if (
      segmentIntersectsCircle(
        prevX,
        prevY,
        nextX,
        nextY,
        tank.x,
        tank.y,
        TANK_RADIUS + PROJECTILE_RADIUS
      )
    ) {
      return {
        expired: true,
        hitWall: false,
        hitTankId: tank.id,
        impactX: nextX,
        impactY: nextY,
      };
    }
  }

  proj.x = nextX;
  proj.y = nextY;

  if (proj.distanceTraveled >= proj.maxRange) {
    return {
      expired: true,
      hitWall: false,
      hitTankId: null,
      impactX: nextX,
      impactY: nextY,
    };
  }

  return {
    expired: false,
    hitWall: false,
    hitTankId: null,
    impactX: nextX,
    impactY: nextY,
  };
}

export function selectSafeSpawn(
  spawns: Vec2[],
  enemies: Pick<TankEntity, 'x' | 'y' | 'alive'>[],
  obstacles: Obstacle[]
): Vec2 {
  const validSpawns = spawns.filter(
    (sp) => !obstacles.some((o) => circleIntersectsRect(sp.x, sp.y, TANK_RADIUS + 4, o))
  );
  const candidates = validSpawns.length > 0 ? validSpawns : spawns;
  const livingEnemies = enemies.filter((e) => e.alive);

  if (livingEnemies.length === 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  let bestSpawn = candidates[0];
  let bestMinDist = -1;

  for (const sp of candidates) {
    let minEnemyDistSq = Infinity;
    for (const enemy of livingEnemies) {
      const d = distanceSq(sp.x, sp.y, enemy.x, enemy.y);
      if (d < minEnemyDistSq) {
        minEnemyDistSq = d;
      }
    }
    if (minEnemyDistSq > bestMinDist) {
      bestMinDist = minEnemyDistSq;
      bestSpawn = sp;
    }
  }

  return { x: bestSpawn.x, y: bestSpawn.y };
}

export function findValidCratePosition(
  map: ArenaMap,
  crates: SupplyCrateEntity[],
  tanks: TankEntity[]
): Vec2 | null {
  const isPositionClear = (x: number, y: number): boolean => {
    if (
      x < CRATE_RADIUS + 20 ||
      x > map.width - CRATE_RADIUS - 20 ||
      y < CRATE_RADIUS + 20 ||
      y > map.height - CRATE_RADIUS - 20
    ) {
      return false;
    }
    for (const obs of map.obstacles) {
      if (circleIntersectsRect(x, y, CRATE_RADIUS + 14, obs)) return false;
    }
    for (const c of crates) {
      if (distanceSq(x, y, c.x, c.y) < (CRATE_RADIUS * 3.5) ** 2) return false;
    }
    for (const t of tanks) {
      if (t.alive && distanceSq(x, y, t.x, t.y) < (TANK_RADIUS + CRATE_RADIUS + 40) ** 2) {
        return false;
      }
    }
    return true;
  };

  // Try curated crateZones first in shuffled order
  const shuffled = [...map.crateZones].sort(() => Math.random() - 0.5);
  for (const zone of shuffled) {
    if (isPositionClear(zone.x, zone.y)) {
      return { x: zone.x, y: zone.y };
    }
  }

  // Fallback random sampling
  for (let attempt = 0; attempt < 25; attempt++) {
    const x = 100 + Math.random() * (map.width - 200);
    const y = 100 + Math.random() * (map.height - 200);
    if (isPositionClear(x, y)) {
      return { x: Math.round(x), y: Math.round(y) };
    }
  }

  return null;
}
