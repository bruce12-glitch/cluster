import { Canvas } from '@react-three/fiber'

import { usePointer } from '../hooks/usePointer'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { CAMERA } from '../lib/layout'
import { CameraRig } from './CameraRig'
import { Effects } from './Effects'
import { EnergyFloor } from './EnergyFloor'
import { FrameGovernor } from './FrameGovernor'
import { KineticLights } from './KineticLights'
import { ParticleField } from './ParticleField'
import { ServerCluster } from './ServerCluster'
import { StudioEnvironment } from './StudioEnvironment'

/**
 * Quality ceiling. The governor may walk this down, never up.
 *
 * 1.5 rather than 2: the only high-frequency detail in the frame is 1px
 * wireframe, which reads perfectly well at 1.5x, while the post chain's
 * full-screen passes get 44% cheaper than they would at 2x.
 */
const MAX_DPR = 1.5

/**
 * Quality floor.
 *
 * The governor may not go below this. It is 0.75 rather than 1.0 for a measured
 * reason: in this scene the post chain costs more than the render itself. On
 * integrated graphics (Intel UHD, measured at 1600x900) the scene alone runs at
 * 121fps but the full chain drops it to ~45fps — the chain alone is ~14ms of a
 * 16.6ms budget, and no amount of geometry tuning moves it. Below dpr 1.0 the
 * resolution lever is the only one left that scales the *whole* frame, and it
 * scales quadratically: 0.75 is 56% of the pixels, which takes the same machine
 * to ~79fps.
 *
 * A slightly soft frame that holds 60 beats a crisp one that drops to 45, and
 * only a GPU that genuinely cannot keep up will ever see this value — every
 * other machine sits at MAX_DPR.
 */
const MIN_DPR = 0.75

/**
 * The whole WebGL layer.
 *
 * Composition is flat and explicit — camera, lighting, particles, floor,
 * monument, post — with the two invisible systems (the rig and the governor)
 * sitting alongside the visible ones. There is no configuration surface here on
 * purpose: the scene is fully self-directing.
 *
 * `<Canvas flat>` disables three's built-in tone mapping so that the post chain
 * owns the curve; `antialias` is off because the composer renders through its own
 * target, where the canvas-level flag has no effect.
 */
export function Experience() {
  const pointer = usePointer()
  const reducedMotion = usePrefersReducedMotion()

  return (
    <div className="absolute inset-0">
      <Canvas
        flat
        dpr={[MIN_DPR, MAX_DPR]}
        gl={{
          antialias: false,
          alpha: false,
          stencil: false,
          depth: true,
          powerPreference: 'high-performance',
        }}
        camera={{
          position: CAMERA.position,
          fov: CAMERA.fov,
          near: CAMERA.near,
          far: CAMERA.far,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 1)
        }}
      >
        <CameraRig pointer={pointer} reducedMotion={reducedMotion} />

        <StudioEnvironment />
        <KineticLights reducedMotion={reducedMotion} />

        <ParticleField reducedMotion={reducedMotion} />
        <EnergyFloor />
        <ServerCluster reducedMotion={reducedMotion} />

        <Effects reducedMotion={reducedMotion} />
        <FrameGovernor max={MAX_DPR} min={MIN_DPR} />
      </Canvas>
    </div>
  )
}
