/**
 * Scene geometry, all in world units.
 *
 * Keeping the layout here (rather than inline in components) means the chassis,
 * the bay grid, the core slots and the camera framing are derived from one set
 * of numbers — retune the monolith and everything else follows.
 */

/** Mutable tuple so it can be handed straight to R3F's `position` props. */
export type Vec3 = [number, number, number]

/* ------------------------------------------------------------------ camera */

export const CAMERA = {
  position: [0, 0.52, 10.8] as Vec3,
  fov: 40,
  near: 0.1,
  far: 240,
  /** Where the lens looks. Slightly above the cluster's centre of mass. */
  focus: [0, 0.14, 0] as Vec3,
  /** Parallax travel, in world units, per unit of normalised cursor offset. */
  parallax: { x: 1.15, y: 0.62, z: 0.55 },
  /** Higher = snappier cursor tracking. 3.1 gives a weighted, filmic lag. */
  damping: 3.1,
} as const

/**
 * Framing heuristics for viewports that are not widescreen.
 *
 * The composition is built around a wide frame: monument in the middle, headline
 * down the left. On a portrait phone that arrangement collapses — the cluster
 * fills the full width and the type lands on top of the glowing cores. Rather
 * than switch to a second layout, the camera re-frames itself: it pulls back so
 * the cluster always leaves the frame's edges alone, and drops its focus point so
 * the monument rides high and the type gets the lower third to itself.
 */
export const FRAMING = {
  /** At or above this width/height ratio, the reference framing is used as-is. */
  referenceAspect: 1.6,
  /** The aspect treated as "fully portrait" — the end of the interpolation. */
  portraitAspect: 0.45,
  /** Maximum camera pull-back, as a multiplier of the reference distance. */
  maxPullBack: 2.3,
  /** How far the focus point drops, in world units, at full portrait. */
  portraitFocusDrop: 1.15,
} as const

/* -------------------------------------------------------------- the cluster */

/** The central monolith: the 8-chip arithmetic fabric lives in here. */
export const MONOLITH = {
  width: 2.86,
  height: 5.2,
  depth: 1.92,
} as const

/** The 2 x 4 core grid inside the monolith. */
export const BAY = {
  columns: 2,
  rows: 4,
  gapX: 1.24,
  gapY: 1.14,
  core: { width: 0.46, height: 0.38, depth: 0.62 },
} as const

/**
 * Flanking racks — wireframe + faint glass only, no cores.
 *
 * Exactly two, kept tight to the monolith. A wider array would look busier and
 * would eat the left third of the frame that the headline needs to breathe in.
 */
export const FLANK_TOWERS = [
  { x: 2.22, width: 1.26, height: 3.42, depth: 1.5 },
  { x: -2.22, width: 1.26, height: 3.42, depth: 1.5 },
] as const

export interface CoreSlot {
  readonly index: number
  readonly position: Vec3
  /** Radians. Staggered so the pulse reads as a wave travelling the fabric. */
  readonly phase: number
}

function buildCoreSlots(): readonly CoreSlot[] {
  const slots: CoreSlot[] = []
  const halfColumns = (BAY.columns - 1) / 2
  const halfRows = (BAY.rows - 1) / 2

  for (let row = 0; row < BAY.rows; row += 1) {
    for (let column = 0; column < BAY.columns; column += 1) {
      const index = row * BAY.columns + column
      slots.push({
        index,
        position: [(column - halfColumns) * BAY.gapX, (row - halfRows) * BAY.gapY, 0],
        phase: index * 0.62,
      })
    }
  }

  return slots
}

/** The eight holographic cores, laid out as a 2 x 4 arithmetic pipeline. */
export const CORE_SLOTS: readonly CoreSlot[] = buildCoreSlots()

/* ------------------------------------------------------------- particle field */

/** Star-particles making up the token-data constellation. */
export const CONSTELLATION_COUNT = 8000
/** Streak-particles that drift vertically through the cluster. */
export const STREAM_COUNT = 700

export const FIELD = {
  /** Nothing is spawned closer than this to the lens. */
  innerRadius: 6.2,
  /** Outer shell. Beyond this the field is empty. */
  outerRadius: 36,
  /** Vertical squash — a slightly oblate cloud reads as "space", not "ball". */
  squashY: 0.78,
} as const

export const STREAM = {
  /** Total vertical travel of a single streak, in world units. */
  span: 28,
  /** Innermost spawn radius. Keeps the streaks off the lens. */
  innerRadius: 1.45,
  outerRadius: 6.4,
} as const
