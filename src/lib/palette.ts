import { Color } from 'three'

/**
 * The palette.
 *
 * Every emissive surface, light, edge and particle in the scene pulls its hue
 * from here so the WebGL layer and the HTML overlay stay chromatically
 * identical. Strings are the source of truth (they are also used verbatim by
 * CSS/Tailwind); `SWATCH` holds the pre-built linear-space `Color` instances
 * the geometry builders reuse so they never allocate per-vertex.
 */
export const PALETTE = {
  /** Absolute, deep pitch black. The one and only background. */
  void: '#000000',
  /** Near-white ink for the headline. */
  ink: '#eaf7fb',
  /** Muted grey for the caption. */
  muted: '#6d7f8a',
  /** Neon core cyan — the signature hue of the chip array. */
  cyan: '#4fe9ff',
  /** Mid blue, used for the rim light and mid-shell particles. */
  azure: '#2f8cff',
  /** Deep indigo, for the far field. */
  indigo: '#3b5bff',
  /** Violet, reserved for the outermost constellation shell. */
  violet: '#9a5cff',
  /** Cold, almost-black glass tint for the chassis panels. */
  frost: '#0b1c26',
  /** Wireframe edge colour. */
  edge: '#8bf6ff',
} as const

/** Reusable linear-space colours — never allocate a `Color` inside a loop. */
export const SWATCH = {
  white: new Color('#ffffff'),
  cyan: new Color(PALETTE.cyan),
  azure: new Color(PALETTE.azure),
  indigo: new Color(PALETTE.indigo),
  violet: new Color(PALETTE.violet),
  ink: new Color(PALETTE.ink),
} as const
