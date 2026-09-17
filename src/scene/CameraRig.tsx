import { useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'

import { CAMERA, FRAMING } from '../lib/layout'
import type { PointerState } from '../hooks/usePointer'

interface CameraRigProps {
  pointer: RefObject<PointerState>
  reducedMotion: boolean
}

/**
 * The kinetic parallax rig.
 *
 * Three motions are layered on one camera:
 *
 *  1. **Ambient drift** — two incommensurable sine waves (0.13Hz and 0.17Hz)
 *     that never repeat, so the shot is always imperceptibly moving even when
 *     the cursor is still.
 *  2. **Cursor parallax** — the normalised pointer position is damped toward its
 *     target with a frame-rate-independent exponential filter, then applied to
 *     the camera's position *and* its look-at point. Because the two are offset
 *     from each other the cluster appears to rotate in depth rather than simply
 *     sliding across the screen.
 *  3. **Responsive re-framing** — the distance and focus point interpolate with
 *     the viewport aspect so the same composition survives on a phone.
 *
 * Zero allocations: no vectors, no tuples, no object literals in the loop —
 * `position.set()` and `lookAt()` both take plain numbers.
 */
export function CameraRig({ pointer, reducedMotion }: CameraRigProps) {
  const damped = useRef({ x: 0, y: 0 })

  useFrame((state, delta) => {
    // Clamp the step so a resumed background tab cannot snap the camera.
    const step = Math.min(delta, 1 / 30)
    const cursor = pointer.current
    const time = state.clock.elapsedTime

    // 0 on widescreen, 1 on a fully portrait viewport.
    const aspect = state.viewport.aspect
    const portrait = Math.max(
      0,
      Math.min(
        1,
        (FRAMING.referenceAspect - aspect) / (FRAMING.referenceAspect - FRAMING.portraitAspect),
      ),
    )
    const pullBack = 1 + (FRAMING.maxPullBack - 1) * portrait
    const focusY = CAMERA.focus[1] - FRAMING.portraitFocusDrop * portrait

    const engage = cursor.active && !reducedMotion ? 1 : 0
    const targetX = cursor.x * engage
    const targetY = cursor.y * engage

    // Frame-rate independent exponential smoothing.
    const blend = 1 - Math.exp(-CAMERA.damping * step)
    damped.current.x += (targetX - damped.current.x) * blend
    damped.current.y += (targetY - damped.current.y) * blend

    const drift = reducedMotion ? 0.22 : 1
    const px =
      CAMERA.position[0] + damped.current.x * CAMERA.parallax.x + Math.sin(time * 0.13) * 0.55 * drift
    const py =
      CAMERA.position[1] + damped.current.y * CAMERA.parallax.y + Math.cos(time * 0.17) * 0.34 * drift
    const pz =
      CAMERA.position[2] * pullBack +
      damped.current.y * CAMERA.parallax.z -
      Math.abs(damped.current.x) * 0.28

    state.camera.position.set(px, py, pz)
    state.camera.lookAt(
      CAMERA.focus[0] + damped.current.x * 0.36,
      focusY + damped.current.y * 0.24,
      CAMERA.focus[2],
    )
  })

  return null
}
