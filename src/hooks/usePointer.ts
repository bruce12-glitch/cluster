import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

export interface PointerState {
  /** Normalised cursor X in `[-1, 1]`, origin at the viewport centre. */
  x: number
  /** Normalised cursor Y in `[-1, 1]`, positive = up. */
  y: number
  /** False while the cursor is outside the window, so the rig can re-centre. */
  active: boolean
}

/**
 * Cursor tracking for the kinetic parallax.
 *
 * Deliberately ref-based: a `pointermove` listener fires up to 500x/second, and
 * routing that through React state would schedule a re-render per event and
 * shred the frame budget. Nothing here ever causes React to render — the
 * consumer reads `.current` inside `useFrame` and damps it there.
 */
export function usePointer(): RefObject<PointerState> {
  const pointer = useRef<PointerState>({ x: 0, y: 0, active: false })

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1)
      pointer.current.active = true
    }

    const handleExit = () => {
      pointer.current.active = false
    }

    window.addEventListener('pointermove', handleMove, { passive: true })
    window.addEventListener('pointerdown', handleMove, { passive: true })
    window.addEventListener('pointerleave', handleExit, { passive: true })
    window.addEventListener('blur', handleExit)

    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerdown', handleMove)
      window.removeEventListener('pointerleave', handleExit)
      window.removeEventListener('blur', handleExit)
    }
  }, [])

  return pointer
}
