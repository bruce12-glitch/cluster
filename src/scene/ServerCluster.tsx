import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'

import { BAY, FLANK_TOWERS, MONOLITH } from '../lib/layout'
import { FrostedPanel, LightSeam, SolidBlock, WireBlock } from './GlassShell'
import { GpuArray } from './GpuArray'

/**
 * Ambient orbit rate, radians per second.
 *
 * ~0.032 rad/s is a full revolution every 3.3 minutes: fast enough that the
 * cluster is unmistakably turning, slow enough that the frontal, symmetric
 * silhouette — the shot the piece is composed around — stays on screen for
 * long stretches instead of flashing past.
 */
const ORBIT_RATE = 0.032

interface ServerClusterProps {
  reducedMotion: boolean
}

/**
 * The central monument: a monolithic glass rack with the GPU fabric suspended
 * inside it, flanked by four progressively shorter wireframe racks that give the
 * silhouette depth without adding detail.
 *
 * The whole assembly orbits and tilts on a single group. One transform per frame
 * for the entire cluster — the parts are static children, so nothing below this
 * node costs anything to animate.
 */
export function ServerCluster({ reducedMotion }: ServerClusterProps) {
  const assembly = useRef<Group>(null)

  // Shelf boundaries: one more than the number of rows, so the stack is closed
  // top and bottom.
  const shelves = useMemo(() => {
    const half = (BAY.rows - 1) / 2
    const heights: number[] = []
    for (let i = 0; i <= BAY.rows; i += 1) {
      heights.push((i - half - 0.5) * BAY.gapY)
    }
    return heights
  }, [])

  useFrame((state, delta) => {
    const node = assembly.current
    if (!node) return

    const time = state.clock.elapsedTime
    const speed = reducedMotion ? 0.16 : 1
    // Clamp so a stalled tab (or a background tab resuming) cannot teleport the
    // cluster into a spin.
    const step = Math.min(delta, 1 / 30)

    node.rotation.y += step * ORBIT_RATE * speed
    node.rotation.x = Math.sin(time * 0.16 * speed) * 0.045
    node.rotation.z = Math.cos(time * 0.11 * speed) * 0.018
    node.position.y = Math.sin(time * 0.42 * speed) * 0.13
  })

  const capY = MONOLITH.height * 0.5 + 0.11
  const plinthY = -MONOLITH.height * 0.5 - 0.17

  return (
    <group ref={assembly}>
      {/* ---------------------------------------------------- central monolith */}
      <FrostedPanel width={MONOLITH.width} height={MONOLITH.height} depth={MONOLITH.depth} />
      <WireBlock
        width={MONOLITH.width}
        height={MONOLITH.height}
        depth={MONOLITH.depth}
        opacity={0.44}
      />

      {shelves.map((y) => (
        <group key={`shelf-${y}`}>
          <FrostedPanel
            width={MONOLITH.width * 0.985}
            height={0.07}
            depth={MONOLITH.depth * 0.94}
            position={[0, y, 0]}
            opacity={0.34}
            emissiveIntensity={0.72}
          />
          <WireBlock
            width={MONOLITH.width * 0.985}
            height={0.07}
            depth={MONOLITH.depth * 0.94}
            position={[0, y, 0]}
            opacity={0.22}
          />
        </group>
      ))}

      {/* Vertical light leaks framing the fabric on the front face. */}
      <LightSeam
        width={0.014}
        height={MONOLITH.height * 0.86}
        depth={0.008}
        position={[-0.72, 0, MONOLITH.depth * 0.5 + 0.006]}
        opacity={0.3}
      />
      <LightSeam
        width={0.014}
        height={MONOLITH.height * 0.86}
        depth={0.008}
        position={[0.72, 0, MONOLITH.depth * 0.5 + 0.006]}
        opacity={0.3}
      />

      <GpuArray reducedMotion={reducedMotion} />

      {/* ------------------------------------------------------- cap and plinth */}
      <SolidBlock
        width={MONOLITH.width * 1.06}
        height={0.22}
        depth={MONOLITH.depth * 1.08}
        position={[0, capY, 0]}
      />
      <WireBlock
        width={MONOLITH.width * 1.06}
        height={0.22}
        depth={MONOLITH.depth * 1.08}
        position={[0, capY, 0]}
        opacity={0.5}
      />

      <SolidBlock
        width={MONOLITH.width * 1.18}
        height={0.34}
        depth={MONOLITH.depth * 1.16}
        position={[0, plinthY, 0]}
      />
      <WireBlock
        width={MONOLITH.width * 1.18}
        height={0.34}
        depth={MONOLITH.depth * 1.16}
        position={[0, plinthY, 0]}
        opacity={0.5}
      />

      {/* -------------------------------------------------------- flanking racks */}
      {FLANK_TOWERS.map((tower) => {
        const inward = tower.x > 0 ? -1 : 1
        // Bottom-aligned with the monolith so the array reads as one machined
        // assembly rather than five floating boxes.
        const y = -MONOLITH.height * 0.5 + tower.height * 0.5

        return (
          <group key={`tower-${tower.x}`} position={[tower.x, y, 0]}>
            <FrostedPanel
              width={tower.width}
              height={tower.height}
              depth={tower.depth}
              opacity={0.09}
              emissiveIntensity={0.18}
            />
            <WireBlock
              width={tower.width}
              height={tower.height}
              depth={tower.depth}
              opacity={0.26}
            />

            <LightSeam
              width={0.012}
              height={tower.height * 0.78}
              depth={0.008}
              position={[inward * (tower.width * 0.5 + 0.006), 0, tower.depth * 0.5 + 0.006]}
              opacity={0.2}
            />

            {[-0.3, 0, 0.3].map((offset) => (
              <LightSeam
                key={`rung-${offset}`}
                width={tower.width * 0.9}
                height={0.01}
                depth={0.008}
                position={[0, tower.height * offset, tower.depth * 0.5 + 0.006]}
                opacity={0.16}
              />
            ))}
          </group>
        )
      })}
    </group>
  )
}
