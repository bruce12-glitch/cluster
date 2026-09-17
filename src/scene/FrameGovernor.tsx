import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

interface FrameGovernorProps {
  /** Device pixel ratio ceiling — the quality we *want* to run at. */
  max: number
  /** Floor. Never drop below this; a blurry frame is worse than a slow one. */
  min: number
}

/** Frames per decision. ~1.5s of history at 60fps — long enough to ignore GC. */
const SAMPLE_SIZE = 90
/** Rolling average above this means we are not holding 60fps. */
const DOWNGRADE_MS = 20.5
/** ...and below this we have comfortable headroom to climb back. */
const UPGRADE_MS = 12.5
/** Minimum seconds between resolution changes, so the image cannot flicker. */
const COOLDOWN_SECONDS = 3
/** Ignore the first moments: shader compilation and texture upload are spikes. */
const WARMUP_SECONDS = 2.5
/** Consecutive comfortable samples before the ceiling is handed back a step. */
const RECOVERY_SAMPLES = 8

/**
 * Adaptive resolution, invisible.
 *
 * A fixed `dpr` is a guess. This watches the rolling frame time and, when the
 * GPU cannot hold the budget, steps the device pixel ratio down by 0.25 — and
 * steps it back up when there is headroom again.
 *
 * The crucial detail is the **ratchet**: the first time we have to downgrade,
 * that level becomes the new ceiling. Without it the governor oscillates between
 * two resolutions forever, which looks far worse than simply running a little
 * softer. The ratchet is paired with a slow release — after a sustained stretch
 * of comfortable frames the ceiling is handed back one step — so a machine that
 * was merely busy for a moment (a build running, a restored tab) is not punished
 * for the rest of the session.
 *
 * All state lives in a ref — the only thing that ever triggers a React render is
 * the `setDpr` call itself, and that happens at most once every three seconds.
 */
export function FrameGovernor({ max, min }: FrameGovernorProps) {
  const setDpr = useThree((state) => state.setDpr)

  const budget = useRef({
    sum: 0,
    frames: 0,
    cooldown: 0,
    warmup: 0,
    comfortable: 0,
    dpr: max,
    ceiling: max,
  })

  useFrame((_state, delta) => {
    const b = budget.current

    // A tab that was just restored reports an enormous delta. Discard the
    // sample rather than letting it poison the average.
    if (delta > 0.5) {
      b.sum = 0
      b.frames = 0
      return
    }

    b.warmup += delta
    if (b.warmup < WARMUP_SECONDS) {
      b.sum = 0
      b.frames = 0
      return
    }

    b.cooldown -= delta
    b.sum += delta * 1000
    b.frames += 1

    if (b.frames < SAMPLE_SIZE) return

    const average = b.sum / b.frames
    b.sum = 0
    b.frames = 0

    b.comfortable = average < UPGRADE_MS ? b.comfortable + 1 : 0

    if (b.cooldown > 0) return

    if (average > DOWNGRADE_MS && b.dpr > min) {
      b.dpr = Math.max(min, b.dpr - 0.25)
      b.ceiling = b.dpr
      setDpr(b.dpr)
      b.cooldown = COOLDOWN_SECONDS
      return
    }

    if (average < UPGRADE_MS && b.dpr < b.ceiling) {
      b.dpr = Math.min(b.ceiling, b.dpr + 0.25)
      setDpr(b.dpr)
      b.cooldown = COOLDOWN_SECONDS
      return
    }

    if (b.comfortable >= RECOVERY_SAMPLES && b.ceiling < max) {
      b.ceiling = Math.min(max, b.ceiling + 0.25)
      b.comfortable = 0
      b.cooldown = COOLDOWN_SECONDS
    }
  })

  return null
}
