import { Environment, Lightformer } from '@react-three/drei'

/**
 * A procedural studio environment.
 *
 * The frosted glass panels are only as convincing as what they have to reflect,
 * and an empty void reflects nothing. Rather than shipping a multi-megabyte HDRI
 * (and a network round-trip on first paint), four emissive rectangles are baked
 * into a 64px cube map **once** — `frames={1}` — and then reused for the rest of
 * the session at zero cost.
 *
 * The emitters are placed to match the orbiting point lights, so the specular
 * highlights and the dynamic lighting agree about where the light is coming from.
 */
export function StudioEnvironment() {
  return (
    <Environment resolution={64} frames={1}>
      {/* Key — cyan, high and camera-right, mirrored by the orbiting key light. */}
      <Lightformer
        form="rect"
        intensity={3.2}
        color="#38e8ff"
        scale={[10, 14, 1]}
        position={[7, 4, -6]}
        target={[0, 0, 0]}
      />

      {/* Fill — indigo, low and camera-left. */}
      <Lightformer
        form="rect"
        intensity={2}
        color="#3b5bff"
        scale={[10, 14, 1]}
        position={[-8, -2, 5]}
        target={[0, 0, 0]}
      />

      {/* Violet overhead bounce. */}
      <Lightformer
        form="rect"
        intensity={1.2}
        color="#9a5cff"
        scale={[12, 8, 1]}
        position={[0, 9, 1]}
        target={[0, 0, 0]}
      />

      {/* A tight ring directly behind the monument for a crisp rim highlight. */}
      <Lightformer
        form="ring"
        intensity={2.4}
        color="#8bf6ff"
        scale={3}
        position={[0, 1, 9]}
        target={[0, 0, 0]}
      />
    </Environment>
  )
}
