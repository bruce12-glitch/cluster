/**
 * A tiny deterministic PRNG (mulberry32).
 *
 * The particle field is generated procedurally at startup. Using a seeded
 * generator instead of `Math.random` means the constellation is byte-identical
 * on every load — the composition can be art-directed rather than left to
 * chance, and a screenshot taken today still matches the one taken tomorrow.
 */
export type Rng = () => number

export function createRng(seed: number): Rng {
  let state = seed >>> 0

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Uniform float in `[min, max)`. */
export function range(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min)
}
