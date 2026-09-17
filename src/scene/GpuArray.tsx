import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  EdgesGeometry,
  MeshStandardMaterial,
  type Group,
} from 'three'

import { BAY, CORE_SLOTS } from '../lib/layout'
import { PALETTE, SWATCH } from '../lib/palette'
import { LightSeam } from './GlassShell'

/**
 * Resting emissive power of a core.
 *
 * Tuned against the tone curve, not against taste. ACES desaturates hard once a
 * channel passes ~1.0, so an emissive of 2.5 that "looks brighter" in the
 * material actually renders as a white rectangle with a cyan halo. Holding the
 * peak at roughly 1.0 keeps the cyan saturated and lets the bloom pass — not the
 * emissive value — be responsible for the glow.
 */
const BASE_INTENSITY = 0.72
/** Peak-to-trough swing of the primary pulse. */
const PULSE_SWING = 0.34

/**
 * The chips get a deeper cyan than the shared accent colour. Under ACES, a
 * near-zero red channel is what keeps an emissive surface reading as *neon*
 * rather than as a white panel with a coloured rim.
 */
const CORE_EMISSIVE = '#10d7ff'

/** Pre-built so the frame loop can `copy()` instead of allocating a Color. */
const CORE_TINT = new Color(CORE_EMISSIVE)

interface GpuArrayProps {
  reducedMotion: boolean
}

/**
 * The core: eight holographic H100/B200-class dies on a 2 x 4 fabric.
 *
 * Every core shares one `BoxGeometry` and one edge geometry, but owns its
 * `MeshStandardMaterial` — per-core material identity is what lets a single
 * `useFrame` drive eight independent pulse phases without instancing tricks or
 * per-frame allocation. Eight draw calls is nothing; eight material swaps per
 * frame would not be.
 */
export function GpuArray({ reducedMotion }: GpuArrayProps) {
  const nodes = useRef<Array<Group | null>>([])

  const coreGeometry = useMemo(
    () => new BoxGeometry(BAY.core.width, BAY.core.height, BAY.core.depth),
    [],
  )

  const shellGeometry = useMemo(() => {
    const source = new BoxGeometry(
      BAY.core.width * 1.26,
      BAY.core.height * 1.36,
      BAY.core.depth * 1.18,
    )
    const edges = new EdgesGeometry(source, 12)
    source.dispose()
    return edges
  }, [])

  const coreMaterials = useMemo(
    () =>
      CORE_SLOTS.map(
        () =>
          new MeshStandardMaterial({
            // Nearly black albedo and low metalness on purpose. A shiny surface
            // would mirror the environment's white emitters and the chips would
            // read as frosted grey panels; this way the emissive is what you
            // actually see, so the cyan stays saturated.
            color: new Color('#02141a'),
            emissive: new Color(CORE_EMISSIVE),
            emissiveIntensity: BASE_INTENSITY,
            roughness: 0.42,
            metalness: 0.16,
            envMapIntensity: 0.2,
          }),
      ),
    [],
  )

  useEffect(
    () => () => {
      coreGeometry.dispose()
      shellGeometry.dispose()
      for (const material of coreMaterials) material.dispose()
    },
    [coreGeometry, shellGeometry, coreMaterials],
  )

  useFrame((state) => {
    const time = state.clock.elapsedTime
    const speed = reducedMotion ? 0.35 : 1

    for (let i = 0; i < coreMaterials.length; i += 1) {
      const material = coreMaterials[i]
      const slot = CORE_SLOTS[i]

      // Two detuned waves: a fast arithmetic pulse riding a slow thermal swell.
      const pulse = Math.sin(time * 1.85 * speed + slot.phase)
      const swell = Math.sin(time * 0.62 * speed + slot.phase * 0.5)

      material.emissiveIntensity = BASE_INTENSITY + pulse * PULSE_SWING + swell * 0.18
      // Only the very crest tips toward white, so the array reads as *computing*
      // rather than as a row of light bulbs.
      material.emissive.copy(CORE_TINT).lerp(SWATCH.white, Math.max(0, pulse) * 0.18)

      const node = nodes.current[i]
      if (node) {
        const scale = 1 + pulse * 0.05
        node.scale.set(scale, scale, scale)
      }
    }
  })

  return (
    <group>
      {CORE_SLOTS.map((slot, index) => (
        <group
          key={slot.index}
          position={slot.position}
          ref={(node) => {
            nodes.current[index] = node
          }}
        >
          <mesh geometry={coreGeometry} material={coreMaterials[index]} />

          <lineSegments geometry={shellGeometry} renderOrder={3}>
            <lineBasicMaterial
              color={PALETTE.edge}
              transparent
              opacity={0.3}
              depthWrite={false}
              blending={AdditiveBlending}
            />
          </lineSegments>

          {/* Light leaking out of the package — the bloom's favourite snack. */}
          <LightSeam
            width={BAY.core.width * 0.94}
            height={0.02}
            depth={0.01}
            position={[0, 0, BAY.core.depth * 0.5 + 0.012]}
            opacity={0.5}
          />
          <LightSeam
            width={0.02}
            height={BAY.core.height * 0.84}
            depth={0.01}
            position={[BAY.core.width * 0.5 + 0.012, 0, 0]}
            opacity={0.34}
          />
        </group>
      ))}
    </group>
  )
}
