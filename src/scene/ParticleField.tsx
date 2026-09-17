import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  ShaderMaterial,
  type Group,
} from 'three'

import { CONSTELLATION_COUNT, FIELD, STREAM, STREAM_COUNT } from '../lib/layout'
import { SWATCH } from '../lib/palette'
import { createRng, range } from '../lib/random'
import {
  constellationVertexShader,
  particleFragmentShader,
  streamVertexShader,
} from './shaders/particles'

const CONSTELLATION_SEED = 0x1f1e11
const STREAM_SEED = 0x51ee70
const TAU = Math.PI * 2

interface ParticleSystem {
  geometry: BufferGeometry
  material: ShaderMaterial
}

interface ParticleFieldProps {
  reducedMotion: boolean
}

/**
 * The token-data constellation.
 *
 * ~8k star-particles on a hollow shell around the monument, plus ~700 streaks
 * that drift vertically through the cluster. Both are single `BufferGeometry`
 * point clouds: 2 draw calls, 2 attribute uploads at startup, and zero CPU work
 * per frame (the drift and twinkle live in the vertex shader).
 */
function buildConstellation(): BufferGeometry {
  const rng = createRng(CONSTELLATION_SEED)
  const positions = new Float32Array(CONSTELLATION_COUNT * 3)
  const colors = new Float32Array(CONSTELLATION_COUNT * 3)
  const sizes = new Float32Array(CONSTELLATION_COUNT)
  const phases = new Float32Array(CONSTELLATION_COUNT)
  const twinkles = new Float32Array(CONSTELLATION_COUNT)

  const tint = new Color()
  const shell = FIELD.outerRadius - FIELD.innerRadius

  for (let i = 0; i < CONSTELLATION_COUNT; i += 1) {
    // Uniform spherical sampling, then a radius bias toward the outer shell so
    // the cloud reads as a hollow rim rather than a solid ball.
    const theta = rng() * TAU
    const cosPhi = rng() * 2 - 1
    const sinPhi = Math.sqrt(1 - cosPhi * cosPhi)
    const radius = FIELD.innerRadius + Math.pow(rng(), 0.58) * shell

    const i3 = i * 3
    positions[i3] = radius * sinPhi * Math.cos(theta)
    positions[i3 + 1] = radius * cosPhi * FIELD.squashY
    positions[i3 + 2] = radius * sinPhi * Math.sin(theta)

    // Cyan near the monument, violet at the far shell.
    const depth = (radius - FIELD.innerRadius) / shell
    tint.copy(SWATCH.cyan).lerp(SWATCH.violet, Math.min(1, depth * 1.15))
    // A sprinkle of white-hot foreground stars anchors the composition.
    if (rng() > 0.985) tint.lerp(SWATCH.white, 0.8)

    colors[i3] = tint.r
    colors[i3 + 1] = tint.g
    colors[i3 + 2] = tint.b

    sizes[i] = 0.36 + Math.pow(rng(), 2.6) * 1.25
    phases[i] = rng() * TAU
    twinkles[i] = range(rng, 0.3, 1.9)
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('aColor', new BufferAttribute(colors, 3))
  geometry.setAttribute('aSize', new BufferAttribute(sizes, 1))
  geometry.setAttribute('aPhase', new BufferAttribute(phases, 1))
  geometry.setAttribute('aTwinkle', new BufferAttribute(twinkles, 1))

  return geometry
}

/**
 * Vertical token streams — the data actually moving through the fabric.
 */
function buildStreams(): BufferGeometry {
  const rng = createRng(STREAM_SEED)
  const positions = new Float32Array(STREAM_COUNT * 3)
  const colors = new Float32Array(STREAM_COUNT * 3)
  const sizes = new Float32Array(STREAM_COUNT)
  const phases = new Float32Array(STREAM_COUNT)
  const speeds = new Float32Array(STREAM_COUNT)

  const tint = new Color()
  const halfSpan = STREAM.span / 2
  const radial = STREAM.outerRadius - STREAM.innerRadius

  for (let i = 0; i < STREAM_COUNT; i += 1) {
    const theta = rng() * TAU
    const radius = STREAM.innerRadius + Math.pow(rng(), 0.62) * radial
    const i3 = i * 3

    positions[i3] = Math.cos(theta) * radius
    positions[i3 + 1] = rng() * STREAM.span - halfSpan
    positions[i3 + 2] = Math.sin(theta) * radius * 0.78

    // Streaks hugging the chassis are the hot ones; the rest fall back to blue.
    const proximity = 1 - (radius - STREAM.innerRadius) / radial
    tint.copy(SWATCH.azure).lerp(SWATCH.cyan, proximity)

    colors[i3] = tint.r
    colors[i3 + 1] = tint.g
    colors[i3 + 2] = tint.b

    sizes[i] = 0.42 + Math.pow(rng(), 1.7) * 0.95
    phases[i] = rng() * TAU
    speeds[i] = 0.55 + Math.pow(rng(), 1.5) * 2.6
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('aColor', new BufferAttribute(colors, 3))
  geometry.setAttribute('aSize', new BufferAttribute(sizes, 1))
  geometry.setAttribute('aPhase', new BufferAttribute(phases, 1))
  geometry.setAttribute('aSpeed', new BufferAttribute(speeds, 1))

  return geometry
}

export function ParticleField({ reducedMotion }: ParticleFieldProps) {
  const group = useRef<Group>(null)

  const constellation = useMemo<ParticleSystem>(
    () => ({
      geometry: buildConstellation(),
      material: new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uScale: { value: 30 },
          uMinSize: { value: 1.05 },
        },
        vertexShader: constellationVertexShader,
        fragmentShader: particleFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    }),
    [],
  )

  const streams = useMemo<ParticleSystem>(
    () => ({
      geometry: buildStreams(),
      material: new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uScale: { value: 18 },
          uMinSize: { value: 1 },
          uSpan: { value: STREAM.span },
          uHalfSpan: { value: STREAM.span / 2 },
        },
        vertexShader: streamVertexShader,
        fragmentShader: particleFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    }),
    [],
  )

  // These geometries and materials are ours, not R3F's, so we hand them back to
  // the GPU ourselves. Nothing in the frame loop ever allocates.
  useEffect(
    () => () => {
      constellation.geometry.dispose()
      constellation.material.dispose()
      streams.geometry.dispose()
      streams.material.dispose()
    },
    [constellation, streams],
  )

  useFrame((state) => {
    const time = state.clock.elapsedTime
    const dpr = state.viewport.dpr
    const drift = reducedMotion ? 0.12 : 1

    const constellationUniforms = constellation.material.uniforms
    constellationUniforms.uTime.value = time
    constellationUniforms.uPixelRatio.value = dpr

    const streamUniforms = streams.material.uniforms
    streamUniforms.uTime.value = time
    streamUniforms.uPixelRatio.value = dpr

    const node = group.current
    if (node) {
      // Counter-drift against the monument so the field never looks welded on.
      node.rotation.y = time * 0.0075 * drift
      node.rotation.x = Math.sin(time * 0.045 * drift) * 0.035
    }
  })

  return (
    <group ref={group}>
      {/* Shader-displaced vertices invalidate the bounding sphere, so culling
          is switched off for both clouds — they cover the frustum regardless. */}
      <points
        geometry={constellation.geometry}
        material={constellation.material}
        frustumCulled={false}
      />
      <points geometry={streams.geometry} material={streams.material} frustumCulled={false} />
    </group>
  )
}
