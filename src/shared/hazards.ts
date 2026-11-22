import { TANK_RADIUS } from './config.ts';
import type {
  ArenaMap,
  HazardZone,
  Rect,
  SurfaceKind,
  TeamId,
  TurretEntity,
  Vec2,
} from './types.ts';

/** Single block of gameplay numbers for every beta-map mechanic. */
export const HAZARD_TUNING = {
  // Surfaces (applied identically on client prediction and server)
  sandSpeedMul: 0.45,
  sandAccelMul: 0.7,
  iceAccelMul: 0.2,
  iceDecelMul: 0.08,

  // Lava (server-only damage)
  lavaDps: 18,
  lavaGraceMs: 250,

  // Wind (deterministic from seed + match time)
  windAccel: 450, // px/s^2 at full strength
  windEpochMs: 15000,
  windStartMinMs: 3500,
  windStartSpreadMs: 5000,
  windDurMinMs: 3000,
  windDurSpreadMs: 2200,
  windWarnMs: 1500,
  windSelfDamageMul: 0.3,
  windSelfHitMinDist: 150,
  windBendThreshold: 40, // accumulated sideways push (px/s) before a shell counts as wind-bent

  // Stun bombs
  bombEpochMs: 16000,
  bombOffsetMinMs: 3000,
  bombOffsetSpreadMs: 9000,
  bombTelegraphMs: 1700,
  bombRadius: 135,
  bombStunMs: 1200,

  // Turrets
  turretRange: 560,
  turretCooldownMs: 1900,
  turretDamage: 34,
  turretTurnRate: 2.6, // rad/s
  turretAimTolerance: 0.12,
  turretProjectileSpeedMul: 0.8,
  turretOffset: 30,
  turretRadius: 22,
} as const;

// ---------------------------------------------------------------------------
// Seeded RNG
// ---------------------------------------------------------------------------

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(...nums: number[]): number {
  let h = 2166136261 >>> 0;
  for (const n of nums) {
    h ^= (n | 0) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
    h ^= h >>> 13;
  }
  return h >>> 0;
}

export function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 33) + s.charCodeAt(i)) >>> 0;
  }
  return h >>> 0;
}

export function newMatchSeed(): number {
  return (Math.floor(Math.random() * 0xffffffff) >>> 0) || 1;
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

function pointInEllipse(px: number, py: number, z: HazardZone, inflate = 0): boolean {
  const nx = (px - z.x) / (z.rx + inflate);
  const ny = (py - z.y) / (z.ry + inflate);
  return nx * nx + ny * ny <= 1;
}

function pointInRect(px: number, py: number, r: Rect, pad = 0): boolean {
  return px >= r.x - pad && px <= r.x + r.w + pad && py >= r.y - pad && py <= r.y + r.h + pad;
}

function circleHitsRect(cx: number, cy: number, radius: number, r: Rect): boolean {
  const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < radius * radius;
}

function ellipseHitsRect(z: HazardZone, r: Rect, pad: number): boolean {
  if (pointInEllipse(r.x + r.w / 2, r.y + r.h / 2, z, 0)) return true;
  const corners: Vec2[] = [
    { x: r.x - pad, y: r.y - pad },
    { x: r.x + r.w + pad, y: r.y - pad },
    { x: r.x - pad, y: r.y + r.h + pad },
    { x: r.x + r.w + pad, y: r.y + r.h + pad },
  ];
  if (corners.some((c) => pointInEllipse(c.x, c.y, z, 0))) return true;
  const steps = 20;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const bx = z.x + Math.cos(a) * z.rx;
    const by = z.y + Math.sin(a) * z.ry;
    if (pointInRect(bx, by, r, pad)) return true;
  }
  return false;
}

interface AvoidPoint {
  x: number;
  y: number;
  r: number;
}

function buildAvoidPoints(map: ArenaMap): AvoidPoint[] {
  const pts: AvoidPoint[] = [];
  for (const s of [...map.ffaSpawns, ...map.redSpawns, ...map.blueSpawns]) {
    pts.push({ x: s.x, y: s.y, r: 90 });
  }
  for (const c of map.crateZones) pts.push({ x: c.x, y: c.y, r: 75 });
  pts.push({ x: map.redBase.x, y: map.redBase.y, r: map.redBase.radius + 80 });
  pts.push({ x: map.blueBase.x, y: map.blueBase.y, r: map.blueBase.radius + 80 });
  return pts;
}

function inCentralBox(map: ArenaMap, x: number, y: number, hx = 300, hy = 220): boolean {
  return Math.abs(x - map.width / 2) < hx && Math.abs(y - map.height / 2) < hy;
}

// ---------------------------------------------------------------------------
// Zone + turret generation (deterministic from map + seed)
// ---------------------------------------------------------------------------

export interface TurretSpec {
  id: string;
  x: number;
  y: number;
  team: 'red' | 'blue';
  facing: number;
}

export interface MapHazards {
  zones: HazardZone[];
  turrets: TurretSpec[];
}

const EMPTY_HAZARDS: MapHazards = { zones: [], turrets: [] };

export function generateMapHazards(map: ArenaMap, seed: number): MapHazards {
  const spec = map.hazardSpec;
  if (!spec) return EMPTY_HAZARDS;

  const rand = mulberry32(hashSeed(seed, hashString(map.id), 7));
  const avoid = buildAvoidPoints(map);
  const zones: HazardZone[] = [];
  const turrets: TurretSpec[] = [];

  for (const surf of spec.surfaces ?? []) {
    const [cMin, cMax] = surf.count;
    const count = cMin + Math.floor(rand() * (cMax - cMin + 1));
    let placed = 0;
    for (let attempt = 0; attempt < 1600 && placed < count; attempt++) {
      // Shrink candidates the longer placement struggles so every match still gets its patches.
      const shrink = 1 - 0.55 * Math.min(1, attempt / 1200);
      const rx = (surf.rx[0] + rand() * (surf.rx[1] - surf.rx[0])) * shrink;
      const ry = (surf.ry[0] + rand() * (surf.ry[1] - surf.ry[0])) * shrink;
      const x = 80 + rx + rand() * (map.width - 160 - rx * 2);
      const y = 80 + ry + rand() * (map.height - 160 - ry * 2);
      const cand: HazardZone = {
        id: `${surf.kind}_${zones.length}`,
        kind: surf.kind,
        x: Math.round(x),
        y: Math.round(y),
        rx: Math.round(rx),
        ry: Math.round(ry),
      };

      if (inCentralBox(map, cand.x, cand.y)) continue;
      if (avoid.some((p) => pointInEllipse(p.x, p.y, cand, p.r))) continue;
      if (map.obstacles.some((o) => ellipseHitsRect(cand, o, 14))) continue;
      if (
        zones.some((o) => {
          const nx = (cand.x - o.x) / (cand.rx + o.rx);
          const ny = (cand.y - o.y) / (cand.ry + o.ry);
          return nx * nx + ny * ny < 0.9;
        })
      ) {
        continue;
      }
      zones.push(cand);
      placed += 1;
    }
  }

  if (spec.turrets) {
    const [tMin, tMax] = spec.turrets;
    const count = tMin + Math.floor(rand() * (tMax - tMin + 1));
    const T = HAZARD_TUNING;
    const solid = map.obstacles.filter((o) => o.w + o.h >= 140);
    for (let attempt = 0; attempt < 2400 && turrets.length < count && solid.length > 0; attempt++) {
      // Relax spacing if the layout is tight so the minimum turret count is still met.
      const minSep = attempt < 900 ? 520 : attempt < 1700 ? 400 : 300;
      const obs = solid[Math.floor(rand() * solid.length)];
      const side = Math.floor(rand() * 4);
      const t = 0.3 + rand() * 0.4;
      let x = obs.x + obs.w * t;
      let y = obs.y + obs.h * t;
      let facing = 0;
      if (side === 0) {
        y = obs.y - T.turretOffset;
        facing = -Math.PI / 2;
      } else if (side === 1) {
        y = obs.y + obs.h + T.turretOffset;
        facing = Math.PI / 2;
      } else if (side === 2) {
        x = obs.x - T.turretOffset;
        facing = Math.PI;
      } else {
        x = obs.x + obs.w + T.turretOffset;
        facing = 0;
      }
      x = Math.round(x);
      y = Math.round(y);

      if (x < 80 || x > map.width - 80 || y < 80 || y > map.height - 80) continue;
      if (avoid.some((p) => Math.hypot(p.x - x, p.y - y) < p.r + (attempt < 1700 ? 220 : 160))) continue;
      if (
        map.obstacles.some(
          (o) => o.id !== obs.id && circleHitsRect(x, y, T.turretRadius + 6, o)
        )
      ) {
        continue;
      }
      if (turrets.some((o) => Math.hypot(o.x - x, o.y - y) < minSep)) continue;
      if (inCentralBox(map, x, y, 160, 140)) continue;
      turrets.push({
        id: `turret_${turrets.length}`,
        x,
        y,
        team: x < map.width / 2 ? 'red' : 'blue',
        facing,
      });
    }
  }

  return { zones, turrets };
}

export function turretsToEntities(specs: TurretSpec[]): TurretEntity[] {
  return specs.map((s) => ({
    id: s.id,
    x: s.x,
    y: s.y,
    angle: s.facing,
    team: s.team,
    charge: 1,
  }));
}

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

export function getSurfaceAt(zones: HazardZone[], x: number, y: number): SurfaceKind {
  let result: SurfaceKind = 'none';
  for (const z of zones) {
    if (z.kind === 'grass') continue;
    if (!pointInEllipse(x, y, z, 0)) continue;
    if (z.kind === 'lava') return 'lava';
    if (z.kind === 'ice') result = 'ice';
    else if (z.kind === 'sand' && result === 'none') result = 'sand';
  }
  return result;
}

export function isInGrass(zones: HazardZone[], x: number, y: number): boolean {
  for (const z of zones) {
    if (z.kind === 'grass' && pointInEllipse(x, y, z, -TANK_RADIUS * 0.4)) return true;
  }
  return false;
}

export interface SurfaceModifiers {
  speedMul: number;
  accelMul: number;
  decelMul: number;
}

export function surfaceModifiers(kind: SurfaceKind): SurfaceModifiers {
  const T = HAZARD_TUNING;
  if (kind === 'sand') return { speedMul: T.sandSpeedMul, accelMul: T.sandAccelMul, decelMul: 1.3 };
  if (kind === 'ice') return { speedMul: 1, accelMul: T.iceAccelMul, decelMul: T.iceDecelMul };
  return { speedMul: 1, accelMul: 1, decelMul: 1 };
}

// ---------------------------------------------------------------------------
// Wind (pure function of seed + elapsed match time)
// ---------------------------------------------------------------------------

export interface WindState {
  active: boolean;
  warning: boolean;
  angle: number;
  /** 0..1 current effective strength (envelope applied). */
  strength: number;
}

const NO_WIND: WindState = { active: false, warning: false, angle: 0, strength: 0 };

interface Gust {
  start: number;
  end: number;
  angle: number;
  peak: number;
}

function gustForEpoch(seed: number, epoch: number): Gust | null {
  const T = HAZARD_TUNING;
  const r = mulberry32(hashSeed(seed, epoch, 101));
  if (r() < 0.1) return null;
  const start = epoch * T.windEpochMs + T.windStartMinMs + r() * T.windStartSpreadMs;
  const dur = T.windDurMinMs + r() * T.windDurSpreadMs;
  const angle = (r() * 2 - 1) * Math.PI;
  const peak = 0.65 + r() * 0.35;
  return { start, end: start + dur, angle, peak };
}

export function getWindAt(seed: number, elapsedMs: number): WindState {
  if (elapsedMs < 0) return NO_WIND;
  const T = HAZARD_TUNING;
  const epoch = Math.floor(elapsedMs / T.windEpochMs);
  const gust = gustForEpoch(seed, epoch);
  if (!gust) return NO_WIND;

  if (elapsedMs >= gust.start && elapsedMs < gust.end) {
    const t = (elapsedMs - gust.start) / (gust.end - gust.start);
    const envelope = Math.pow(Math.sin(Math.PI * t), 0.6);
    return { active: true, warning: false, angle: gust.angle, strength: gust.peak * envelope };
  }
  if (elapsedMs < gust.start && gust.start - elapsedMs <= T.windWarnMs) {
    return { active: false, warning: true, angle: gust.angle, strength: 0 };
  }
  return NO_WIND;
}

/** Wind for a given map (zero on maps without wind). */
export function getMapWindAt(map: ArenaMap, seed: number, elapsedMs: number): WindState {
  return map.hazardSpec?.wind ? getWindAt(seed, elapsedMs) : NO_WIND;
}

export function windAcceleration(wind: WindState): { ax: number; ay: number } {
  if (!wind.active) return { ax: 0, ay: 0 };
  const mag = wind.strength * HAZARD_TUNING.windAccel;
  return { ax: Math.cos(wind.angle) * mag, ay: Math.sin(wind.angle) * mag };
}

// ---------------------------------------------------------------------------
// Stun bombs (pure function of seed + elapsed match time)
// ---------------------------------------------------------------------------

export interface BombInfo {
  id: string;
  x: number;
  y: number;
  radius: number;
  armAt: number; // elapsed ms when telegraph starts
  detonateAt: number; // elapsed ms when it explodes
}

export function getBombForEpoch(map: ArenaMap, seed: number, epoch: number): BombInfo | null {
  if (!map.hazardSpec?.bombs || epoch < 0) return null;
  const T = HAZARD_TUNING;
  const r = mulberry32(hashSeed(seed, epoch, 202, hashString(map.id)));
  if (r() < 0.1) return null;
  const armAt = epoch * T.bombEpochMs + T.bombOffsetMinMs + r() * T.bombOffsetSpreadMs;

  const avoid = buildAvoidPoints(map);
  let pos: Vec2 | null = null;
  for (let attempt = 0; attempt < 80; attempt++) {
    const x = 200 + r() * (map.width - 400);
    const y = 160 + r() * (map.height - 320);
    if (inCentralBox(map, x, y, 260, 200)) continue;
    if (avoid.some((p) => Math.hypot(p.x - x, p.y - y) < p.r + 40)) continue;
    if (map.obstacles.some((o) => circleHitsRect(x, y, T.bombRadius * 0.55, o))) continue;
    pos = { x: Math.round(x), y: Math.round(y) };
    break;
  }
  if (!pos) return null;

  return {
    id: `bomb_${epoch}`,
    x: pos.x,
    y: pos.y,
    radius: T.bombRadius,
    armAt,
    detonateAt: armAt + T.bombTelegraphMs,
  };
}

/** Bomb relevant at this time (telegraphing, or exploded within the last 700 ms). */
export function getActiveBomb(map: ArenaMap, seed: number, elapsedMs: number): BombInfo | null {
  if (!map.hazardSpec?.bombs || elapsedMs < 0) return null;
  const epoch = Math.floor(elapsedMs / HAZARD_TUNING.bombEpochMs);
  const bomb = getBombForEpoch(map, seed, epoch);
  if (!bomb) return null;
  if (elapsedMs >= bomb.armAt && elapsedMs <= bomb.detonateAt + 700) return bomb;
  return null;
}

// ---------------------------------------------------------------------------
// Turret targeting helpers (shared so tests can exercise them)
// ---------------------------------------------------------------------------

export function isHostileTurretTarget(
  turretTeam: 'red' | 'blue',
  targetTeam: TeamId,
  mode: 'deathmatch' | 'tdm' | 'ctf'
): boolean {
  if (mode === 'ctf') return targetTeam !== turretTeam;
  return true;
}

export function effectiveTurretTeam(
  turretTeam: 'red' | 'blue',
  mode: 'deathmatch' | 'tdm' | 'ctf'
): TeamId {
  return mode === 'ctf' ? turretTeam : 'none';
}
