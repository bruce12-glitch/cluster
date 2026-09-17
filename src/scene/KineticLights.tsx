import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { PointLight } from 'three'

interface KineticLightsProps {
  reducedMotion: boolean
}

/**
 * Dynamic lighting.
 *
 * Two point lights orbit the monument on slow, coprime periods so the specular
 * response of the glass never settles into a repeatable loop, plus a violet
 * underlight that keeps the plinth from reading as a silhouette. Combined with
 * the baked environment map this is what makes the frosted panels look like
 * material rather than a flat alpha gradient.
 *
 * Three lights, no shadow maps: the whole lighting rig costs three uniforms per
 * frame.
 */
export function KineticLights({ reducedMotion }: KineticLightsProps) {
  const key = useRef<PointLight>(null)
  const rim = useRef<PointLight>(null)
  const under = useRef<PointLight>(null)

  useFrame((state) => {
    const time = state.clock.elapsedTime
    const speed = reducedMotion ? 0.12 : 1
    const t = time * speed

    const keyLight = key.current
    if (keyLight) {
      keyLight.position.set(
        Math.cos(t * 0.24) * 7.4,
        4.2 + Math.sin(t * 0.31) * 1.7,
        Math.sin(t * 0.24) * 7.4,
      )
    }

    const rimLight = rim.current
    if (rimLight) {
      rimLight.position.set(
        Math.cos(t * 0.17 + Math.PI) * 8.6,
        -2.1 + Math.cos(t * 0.26) * 1.4,
        Math.sin(t * 0.17 + Math.PI) * 8.6,
      )
    }

    const underLight = under.current
    if (underLight) {
      underLight.position.set(
        Math.sin(t * 0.21) * 3.2,
        -4.4,
        Math.cos(t * 0.21) * 3.2,
      )
    }
  })

  return (
    <>
      {/* Cold ambient floor — never let the shadows go fully black. */}
      <ambientLight intensity={0.16} color="#0d2230" />

      {/* Key: neon cyan, the dominant highlight on the glass. */}
      <pointLight ref={key} color="#4fe9ff" intensity={130} distance={36} decay={2} />

      {/* Rim: indigo, back-left, separates the racks from the void. */}
      <pointLight ref={rim} color="#3b5bff" intensity={95} distance={42} decay={2} />

      {/* Underlight: violet bounce off the energy floor. */}
      <pointLight ref={under} color="#9a5cff" intensity={55} distance={30} decay={2} />

      {/* A very dim fill from behind so the wireframes read on every face. */}
      <directionalLight position={[0, 9, -8]} intensity={0.3} color="#8fd8ff" />
    </>
  )
}
