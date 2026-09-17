import { useEffect, useMemo } from 'react'
import {
  AdditiveBlending,
  BoxGeometry,
  EdgesGeometry,
  FrontSide,
  type ColorRepresentation,
} from 'three'

import type { Vec3 } from '../lib/layout'
import { PALETTE } from '../lib/palette'

/**
 * The four primitives the monument is built from.
 *
 * Nothing here is a "component" in the product sense — there is no state, no
 * props drilling, no interaction. They exist so the chassis can be assembled
 * from a short, readable list of parts and so every geometry/material created
 * outside R3F has exactly one obvious owner to dispose it.
 */

interface BlockProps {
  width: number
  height: number
  depth: number
  position?: Vec3
}

interface FrostedPanelProps extends BlockProps {
  opacity?: number
  tint?: ColorRepresentation
  emissive?: ColorRepresentation
  emissiveIntensity?: number
}

/**
 * Frosted glass.
 *
 * Deliberately *not* `transmission` — real refraction costs a full extra scene
 * pass per frame. Clearcoat over a cold, nearly-black tint reads as etched glass,
 * catches the orbiting key lights, and renders for free.
 *
 * Two further economies, both invisible but measurable: iridescence is left off
 * (a full thin-film interference evaluation per fragment is the single most
 * expensive thing you can put on a surface that covers half the screen), and the
 * panels are single-sided. At 0.2 opacity the back faces contributed almost
 * nothing visually while doubling the transparent fragment count.
 *
 * `depthWrite` is off so the cores inside stay visible.
 */
export function FrostedPanel({
  width,
  height,
  depth,
  position = [0, 0, 0],
  opacity = 0.24,
  tint = PALETTE.frost,
  emissive = '#0e3d4e',
  emissiveIntensity = 0.34,
}: FrostedPanelProps) {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, height, depth]} />
      <meshPhysicalMaterial
        color={tint}
        roughness={0.22}
        metalness={0.14}
        transparent
        opacity={opacity}
        depthWrite={false}
        clearcoat={1}
        clearcoatRoughness={0.12}
        envMapIntensity={2}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        side={FrontSide}
      />
    </mesh>
  )
}

interface WireBlockProps extends BlockProps {
  color?: ColorRepresentation
  opacity?: number
  threshold?: number
}

/**
 * Hairline neon wireframe.
 *
 * Built by hand rather than via a helper so the throwaway source `BoxGeometry`
 * is disposed the instant the edge list has been extracted from it.
 */
export function WireBlock({
  width,
  height,
  depth,
  position = [0, 0, 0],
  color = PALETTE.edge,
  opacity = 0.4,
  threshold = 12,
}: WireBlockProps) {
  const geometry = useMemo(() => {
    const source = new BoxGeometry(width, height, depth)
    const edges = new EdgesGeometry(source, threshold)
    source.dispose()
    return edges
  }, [width, height, depth, threshold])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <lineSegments geometry={geometry} position={position} renderOrder={3}>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </lineSegments>
  )
}

interface LightSeamProps extends BlockProps {
  color?: ColorRepresentation
  opacity?: number
}

/**
 * A thin additive slab of pure, unlit neon. These are the light-leak details —
 * the strips that give the chassis its internal glow and feed the bloom pass.
 */
export function LightSeam({
  width,
  height,
  depth,
  position = [0, 0, 0],
  color = PALETTE.cyan,
  opacity = 0.55,
}: LightSeamProps) {
  return (
    <mesh position={position} renderOrder={2}>
      <boxGeometry args={[width, height, depth]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  )
}

interface SolidBlockProps extends BlockProps {
  tint?: ColorRepresentation
  roughness?: number
  metalness?: number
}

/**
 * Opaque structural metal — caps, plinths, the parts that have to read as
 * machined rather than luminous.
 */
export function SolidBlock({
  width,
  height,
  depth,
  position = [0, 0, 0],
  tint = '#04090d',
  roughness = 0.44,
  metalness = 0.74,
}: SolidBlockProps) {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial
        color={tint}
        roughness={roughness}
        metalness={metalness}
        envMapIntensity={1.2}
      />
    </mesh>
  )
}
