import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color, DoubleSide, PlaneGeometry, ShaderMaterial } from 'three'

import { PALETTE } from '../lib/palette'

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/**
 * A pool of light on the floor.
 *
 * Cheap stand-in for a reflective ground plane: one quad, one shader, no render
 * target. The radial falloff stops abruptly (`discard` past the inscribed
 * circle) so the quad's edges are never visible, and the travelling rings give
 * the plinth something to sit in.
 */
const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uIntensity;

  varying vec2 vUv;

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float d = length(p);

    if (d > 1.0) discard;

    float pool = pow(1.0 - d, 2.6);
    float rings = 0.5 + 0.5 * sin(d * 21.0 - uTime * 1.05);
    float ringMask = smoothstep(0.84, 1.0, rings) * 0.32;
    float breath = 0.88 + 0.12 * sin(uTime * 0.85);

    float energy = pool * (1.0 + ringMask) * breath;

    gl_FragColor = vec4(uColor * energy * uIntensity, energy * 0.5);
  }
`

export function EnergyFloor() {
  // Kept tight: this quad is additive and covers a big slice of the frame, so
  // every world unit of it is fill rate spent.
  const geometry = useMemo(() => new PlaneGeometry(30, 30, 1, 1), [])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new Color(PALETTE.cyan) },
          uIntensity: { value: 0.85 },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
      }),
    [],
  )

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -3.5, 0]}
      renderOrder={1}
    />
  )
}
