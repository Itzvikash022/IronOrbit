# Beta Map Functional Requirements

Functional contract only. No art, palette, theme, or visual guidance.

Use this document to author replacement layouts for the 7 beta maps. Hazard zones (sand / ice / lava / grass), wind gusts, stun bombs, and wall turrets are **not** baked into the map file; they are generated each match from `(mapId, matchSeed)`. Your layout must leave room for those systems to place correctly.

---

## 1. Shared arena contract (all maps)

| Field | Value |
|---|---|
| Arena size | `2880 × 1440` |
| Tank collision radius | `20` |
| Crate collision radius | `18` |
| Modes that use the same layout | FFA, Team DM (TDM), CTF |

### 1.1 Required data per map

Each map must provide:

| Field | Rules |
|---|---|
| `id` | One of: `dunes`, `glacier`, `magma`, `storm`, `sentinel`, `overgrowth`, `blastyard` |
| `name` | Display name (any string) |
| `subtitle` | Short functional blurb (any string) |
| `width` / `height` | Must be `2880` / `1440` |
| `obstacles[]` | Axis-aligned rectangles `{ id, x, y, w, h, kind }` |
| `ffaSpawns[]` | ≥ 8 points used by FFA / TDM spawn picker |
| `redSpawns[]` / `blueSpawns[]` | ≥ 4 each; used by CTF / TDM team spawns |
| `redBase` / `blueBase` | Circles `{ x, y, radius }` used only in CTF |
| `crateZones[]` | ≥ 6 points; supply crates spawn near these |
| `category` | `terrain` or `obstacle` (see §3) |
| `beta` | `true` |
| `hazardSpec` | Exactly as specified per map in §3 (do not invent new kinds) |

`kind` must be one of:

`rock | ruin | container | machinery | tree | barrier | ice_wall | building | wreck | bunker | lava_pillar | sandbag`

Kinds do **not** change collision; they only select which drawing path runs. Collision is always AABB vs circle.

### 1.2 Hard clearance rules (must pass validation)

1. Every obstacle must stay fully inside the arena: `0 ≤ x, x+w ≤ 2880`, `0 ≤ y, y+h ≤ 1440`.
2. Spawn ↔ obstacle: for every spawn in `ffaSpawns`, `redSpawns`, `blueSpawns`, distance from point to obstacle AABB ≥ `TANK_RADIUS + 4` (= **24**).
3. Crate zone ↔ obstacle: for every `crateZones` point, distance to obstacle AABB ≥ `CRATE_RADIUS + 10` (= **28**).
4. Base ↔ obstacle: for each base, distance from base center to obstacle AABB ≥ `base.radius + TANK_RADIUS + 10`.
5. Obstacle ↔ obstacle gap: AABB gap between any two obstacles ≥ **48** (so a tank can squeeze between).
6. Spawns must be ≥ `TANK_RADIUS` from the arena edge.

Recommended (used by the current classic maps and works well with CTF):

- `redBase` ≈ `{ x: 224, y: 720, radius: 68 }`
- `blueBase` ≈ `{ x: 2656, y: 720, radius: 68 }`
- Red spawns clustered on the left third; blue mirrored on the right.
- FFA spawns cover corners + mid lanes, never all piled in the center.

### 1.3 Fairness / layout rules

1. **Horizontal symmetry preferred for CTF.** Author the left half and mirror to the right (`x' = 2880 - x - w`). Bases and team spawns must be fair for red vs blue.
2. **Do not clog the center.** Leave a usable mid-lane so both teams can contest. Hard avoid boxes used by the hazard generator:
   - Surface zones / bombs reject centers inside `|x − 1440| < 300` and `|y − 720| < 220` (bombs use a slightly larger box: 260 × 200).
   - Turrets reject `|x − 1440| < 160` and `|y − 720| < 140`.
3. **Do not put everything in the middle.** Spread cover across side lanes, top/bottom bands, and flanks.
4. **Lanes must exist.** A tank of diameter ~40 must be able to path from any spawn region toward mid without being trapped.
5. **Dense enough for cover, open enough for fights.** Rough target: ~12–20 solid obstacles total after mirroring (classic maps sit around 15). Sentinel needs several large walls for turrets (see §3.5).

### 1.4 What the map file does NOT contain

These are generated at match start / runtime from `matchSeed` + `hazardSpec`. Do not bake them into the map:

- Sand / ice / lava / grass ellipses
- Wind gust schedule
- Stun bomb positions / schedule
- Wall-turret positions / angles

Your job is to provide **geometry** (obstacles + spawn/base/crate anchors) that those systems can attach to safely.

---

## 2. Shared runtime systems (how hazards use your layout)

### 2.1 Match seed

- Each match gets a random `matchSeed`.
- Client and server both call `generateMapHazards(map, matchSeed)` and get identical zones/turrets.
- Wind and bombs are pure functions of `(seed, elapsedMs)` (and map id for bombs).

### 2.2 Avoid points (zones / turrets / bombs must clear these)

When placing dynamic hazards, the engine treats these as keep-out circles:

| Anchor | Keep-out radius |
|---|---|
| Each FFA / red / blue spawn | **90** |
| Each crate zone | **75** |
| Each CTF base | `base.radius + 80` |

So: **do not pack spawns/crates so tightly that no room remains for patches.** Spread them.

### 2.3 Surface priority (when ellipses overlap)

Lookup at tank position uses ellipse containment. Priority:

1. `lava` wins over everything else
2. else `ice`
3. else `sand`
4. `grass` is separate (concealment only; does not affect movement)

### 2.4 Damage / stun authority

| Effect | Authority | Predicted on client? |
|---|---|---|
| Sand / ice movement | Shared physics | Yes |
| Lava damage | Server only | No (HP syncs via snapshot) |
| Stun bombs | Server only | Stun flag syncs on tank |
| Turret shots | Server fires projectiles | Client renders them |
| Wind on shells | Shared projectile step | Yes (same seed + time) |
| Grass concealment | Client visual only | N/A |

Environment kills (lava, wind self-hit) credit killer as `null` / “Environment”. Spawn invincibility and shield block environment damage and stun.

---

## 3. Per-map functional specs

### 3.1 `dunes` — Dune Sea (`category: terrain`)

**Mechanic:** sand patches slow tanks.

```
hazardSpec: {
  surfaces: [{ kind: 'sand', count: [5, 7], rx: [170, 320], ry: [110, 200] }]
}
```

| Behavior | Value |
|---|---|
| Max speed while on sand | `tankMoveSpeed × 0.45` |
| Acceleration while on sand | `tankAcceleration × 0.7` |
| Deceleration while on sand | `tankDeceleration × 1.3` (stops a bit faster) |
| Zone shape | Ellipse, center `(x,y)`, radii `rx, ry` |
| Count per match | 5–7 (must always succeed) |

**Layout requirements for this mechanic:**

1. Leave enough open floor for 5–7 ellipses of ~170–320 × 110–200 without covering spawns/crates/bases.
2. Obstacles should create **corridors that force choices** (drive through sand vs take a longer clear path). Avoid one giant open bowl where sand placement is arbitrary.
3. Prefer some wide lanes and some choke points so sand can matter mid-fight.
4. No other hazardSpec flags (`wind`, `turrets`, `bombs`).

---

### 3.2 `glacier` — Glacier Rift (`category: terrain`)

**Mechanic:** ice patches make tanks hard to control / skid.

```
hazardSpec: {
  surfaces: [{ kind: 'ice', count: [4, 6], rx: [200, 340], ry: [120, 220] }]
}
```

| Behavior | Value |
|---|---|
| Max speed on ice | unchanged (`× 1`) |
| Acceleration on ice | `× 0.2` (slow to reach full speed / change heading) |
| Deceleration on ice | `× 0.08` (keeps sliding long after release) |
| Count per match | 4–6 |

**Layout requirements:**

1. Ice zones are **larger** than sand — leave bigger open floors.
2. Long straightaways + sharp turns make skidding punishable. Avoid a maze so tight that ice never matters because walls stop you first.
3. Thin walls / long barriers that force approach angles work well with slide physics.
4. No wind / turrets / bombs.

---

### 3.3 `magma` — Magma Fields (`category: terrain`)

**Mechanic:** lava pools deal damage over time while a tank stays inside.

```
hazardSpec: {
  surfaces: [{ kind: 'lava', count: [4, 6], rx: [110, 210], ry: [80, 150] }]
}
```

| Behavior | Value |
|---|---|
| Damage | **18 HP / second** while inside (server) |
| Grace | First **250 ms** after entering deal no damage |
| Invincible / shield | Blocks lava damage |
| Kill credit | Environment (`killer = null`) |
| Count per match | 4–6 |
| Zone size | Smaller than sand/ice (tighter pools) |

**Layout requirements:**

1. Leave pockets for 4–6 mid-sized ellipses that do **not** sit on spawn pads.
2. Create **risk routes**: a shorter path that can get lava-blocked vs a safer long path.
3. Do not surround every spawn with walls so tightly that the only exit is forced through a keep-out ring the placer cannot use — lava must still find 4+ legal spots every seed.
4. Bots avoid driving into lava; layout should still allow human aggression through hot zones.
5. No wind / turrets / bombs.

---

### 3.4 `storm` — Storm Plateau (`category: terrain`)

**Mechanic:** wind gusts bend projectiles; a bent shell can hit its owner at reduced damage.

```
hazardSpec: { wind: true }
```

| Behavior | Value |
|---|---|
| Gust cycle | Every **15 000 ms** epoch |
| Gust start within epoch | `3500 + random(0..5000)` ms |
| Gust duration | `3000 + random(0..2200)` ms |
| Warning before gust | **1500 ms** (HUD / visual telegraph) |
| Skip chance per epoch | ~10% (no gust that cycle) |
| Peak lateral accel | up to **450 px/s²** × strength envelope |
| Wind-bent threshold | accumulated sideways push ≥ **40** |
| Self-hit allowed only if | `windBent === true` **and** shell traveled ≥ **150** px |
| Self-hit damage | `projectileDamage × 0.3` (default 100 → 30); cannot one-shot |
| Affects | All shells (players + turrets if present; this map has no turrets) |

**Layout requirements:**

1. This map has **no surface zones**. Obstacles are pure cover / lane control.
2. Prefer **open sightlines with intermittent cover** so wind-bent shots matter (long mid-range engagements).
3. Avoid a fully enclosed bunker map where shells die on walls before wind can bend them.
4. Keep mid playable; wind is global, not position-based.
5. No sand / ice / lava / grass / turrets / bombs.

---

### 3.5 `sentinel` — Sentinel Yard (`category: obstacle`)

**Mechanic:** wall-mounted turrets auto-aim and shoot.

```
hazardSpec: { turrets: [4, 5] }
```

| Behavior | Value |
|---|---|
| Count per match | **4–5** (must always succeed) |
| Mount rule | Attached to a side of a solid obstacle with `w + h ≥ 140`, offset **30** px outward |
| Range | **560** px |
| Cooldown | **1900** ms |
| Damage | **34** (≈ 3 hits to kill at 100 HP) |
| Projectile speed | `projectileSpeed × 0.8` |
| Turn rate | **2.6** rad/s |
| Aim tolerance to fire | **0.12** rad |
| Line of sight | Must not cross any obstacle AABB |
| Team (placement) | `x < 1440` → red-side turret, else blue-side |
| Hostility CTF | Shoots only the **opposing** team; shells carry the turret’s team (friendly fire blocked) |
| Hostility FFA / TDM | Shoots **everyone**; shells team = `none` |
| Ignores | Dead, disconnected, invincible tanks |
| Spawn grace | Turrets cannot fire for ~2.5 s after match start |
| Separation | Prefer ≥ 520 px between turrets (relaxes to 400 / 300 if placement struggles) |

**Layout requirements (critical):**

1. Provide **enough large walls** (`w + h ≥ 140`) on both halves of the map so 4–5 turrets can mount without stacking on the same corner.
2. Walls need **exposed outer faces** with clear LOS into playable lanes (not faces buried against the arena border or jammed against another obstacle).
3. Keep spawn pads ≥ ~220 px clear of likely mount points (engine also enforces avoid radii).
4. Do not put all large walls in the dead center (turret placer rejects center box).
5. Create **lanes that turrets can actually see** — long corridors, courtyard openings, outer approaches.
6. No surface / wind / bomb flags.

---

### 3.6 `overgrowth` — Overgrowth (`category: obstacle`)

**Mechanic:** grass patches conceal tanks from enemies (client-side).

```
hazardSpec: {
  surfaces: [{ kind: 'grass', count: [7, 10], rx: [110, 220], ry: [90, 170] }]
}
```

| Behavior | Value |
|---|---|
| Count per match | 7–10 |
| Movement | **No** speed / accel change |
| Concealment | Client only |
| Self / ally view | Faded “ghost” while in grass |
| Enemy view | Fully **hidden** while in grass, unless revealed |
| Reveal if | Target fired within last **900 ms**, or local tank is within **110** px, or local tank is dead (spectating), or (team modes) same team |
| Grass test | Tank center must be inside the ellipse shrunk by `~0.4 × TANK_RADIUS` |

**Layout requirements:**

1. Need room for **many** medium ellipses (7–10) — leave more open floor than Sentinel.
2. Mix cover (ruins / trees as solid blockers) with open grass-capable pockets so ambushes are possible but not guaranteed.
3. Do not cover every spawn with permanent LOS blockers; grass must still place without overlapping spawn keep-outs.
4. Choke points into grass pockets are useful; a completely open field makes grass placement random and less tactical.
5. No wind / turrets / bombs.

---

### 3.7 `blastyard` — Blast Yard (`category: obstacle`)

**Mechanic:** periodic stun bombs with a telegraph, then a stun pulse.

```
hazardSpec: { bombs: true }
```

| Behavior | Value |
|---|---|
| Epoch length | **16 000 ms** (at most one bomb attempt per epoch) |
| Arm time within epoch | `3000 + random(0..9000)` ms |
| Telegraph duration | **1700 ms** before detonation |
| Skip chance | ~10% of epochs |
| Blast radius | **135** px |
| Stun duration | **1200 ms** |
| Stun effect | Cannot thrust, rotate, or fire; coasts to a stop |
| Blocked by | Invincibility, shield |
| Placement avoid | Spawns, crates, bases, obstacles (~0.55 × radius), center box |
| Same bomb | Detonates once only |

**Layout requirements:**

1. No surface zones / wind / turrets — bombs are free-floating on the floor.
2. Leave **open courtyards / scrap yards** where a 135-radius blast can land without always overlapping obstacles.
3. Avoid filling the map so densely that bombs fail to place (then the mechanic disappears).
4. Cover should create “safe pockets” vs “exposed yards” so players can read the telegraph and leave.

---

## 4. Lobby / selection contract

| Rule | Detail |
|---|---|
| Grouping | Classic / Terrain (beta) / Obstacle (beta) |
| Terrain ids | `dunes`, `glacier`, `magma`, `storm` |
| Obstacle ids | `sentinel`, `overgrowth`, `blastyard` |
| Randomize default | Classic only |
| Host toggle | `includeBetaMaps` — when true, Randomize / Play Again may pick beta ids |
| Host may always | Manually select any beta map from the dropdown |

---

## 5. Deliverable format (what to send back)

For each of the 7 maps, provide a complete `ArenaMap`-compatible object (or a JSON dump of the same fields) with:

1. Fixed geometry: `obstacles`, `ffaSpawns`, `redSpawns`, `blueSpawns`, `redBase`, `blueBase`, `crateZones`
2. Identity: `id`, `name`, `subtitle`, `width`, `height`, `category`, `beta: true`
3. Exact `hazardSpec` from §3 for that id (do not change counts / sizes unless we agree to retune)
4. `palette` may be present for the engine but is **out of scope for this requirements doc** — any placeholder is fine until art is decided

### Validation checklist before handoff

- [ ] Size 2880×1440  
- [ ] Spawn / crate / base clearances (§1.2)  
- [ ] Obstacle gaps ≥ 48  
- [ ] CTF-fair (mirrored or otherwise balanced)  
- [ ] Center not overpacked  
- [ ] Enough open floor for that map’s `hazardSpec` counts  
- [ ] Sentinel: enough large walls (`w+h ≥ 140`) with free outer faces on both halves  
- [ ] Storm / Blast Yard: enough open LOS / open yards for their global mechanics  
- [ ] No baked sand/ice/lava/grass/turret/bomb entities in the file  

---

## 6. Quick reference — hazardSpec only

| id | category | hazardSpec |
|---|---|---|
| `dunes` | terrain | sand × 5–7, rx 170–320, ry 110–200 |
| `glacier` | terrain | ice × 4–6, rx 200–340, ry 120–220 |
| `magma` | terrain | lava × 4–6, rx 110–210, ry 80–150 |
| `storm` | terrain | `wind: true` |
| `sentinel` | obstacle | `turrets: [4, 5]` |
| `overgrowth` | obstacle | grass × 7–10, rx 110–220, ry 90–170 |
| `blastyard` | obstacle | `bombs: true` |

---

## 7. Tuning constants (do not bake into layout; for awareness)

From `HAZARD_TUNING` / defaults:

- Sand: speed 0.45×, accel 0.7×, decel 1.3×  
- Ice: accel 0.2×, decel 0.08×  
- Lava: 18 DPS after 250 ms grace  
- Wind: 15 s epochs, ~3–5.2 s gusts, 1.5 s warning, 450 px/s² peak, self-hit ×0.3 after 150 px travel  
- Bombs: 16 s epochs, 1.7 s telegraph, radius 135, stun 1.2 s  
- Turrets: range 560, CD 1.9 s, damage 34, mount offset 30  

Default shell damage is **100**; keep self-hit and turret damage non–one-shot as above.
