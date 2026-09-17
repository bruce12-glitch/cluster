import { useMemo } from 'react'
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  ToneMapping,
} from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { Vector2 } from 'three'

interface EffectsProps {
  reducedMotion: boolean
}

/**
 * The post chain — deliberately only three passes.
 *
 * The renderer is created with tone mapping *off* (`<Canvas flat>`), which makes
 * the pipeline unambiguous: the scene is drawn in linear light, every effect
 * operates on linear values, and exactly one ACES curve is applied at the very
 * end. Nothing is converted twice, so the neon keeps its saturation instead of
 * washing out to grey.
 *
 * **Why not more effects.** Every entry here is a full-screen pass, and on
 * integrated graphics the pass count — not the geometry — is what decides
 * whether the page holds 60fps. A `Vignette` and a `Noise` effect would be two
 * more passes doing exactly what the CSS layers in `overlay/Atmosphere.tsx`
 * already do for free. The composer therefore only carries what CSS cannot
 * fake:
 *
 *   Bloom               — picks up the emissive seams, chip faces and star field
 *   ChromaticAberration — a sub-pixel radial lens split
 *   ToneMapping         — the single, final ACES + sRGB encode
 *
 * `multisampling={0}` because bloom already softens the image and MSAA buffers
 * are expensive at high DPR; the line work stays crisp thanks to the device
 * pixel ratio rather than to samples.
 */
export function Effects({ reducedMotion }: EffectsProps) {
  // Created once, outside the render loop — a fresh Vector2 per frame would be a
  // per-frame allocation for a value that never changes.
  const aberrationOffset = useMemo(
    () => new Vector2(reducedMotion ? 0.0003 : 0.0007, reducedMotion ? 0.0005 : 0.0011),
    [reducedMotion],
  )

  return (
    <EffectComposer multisampling={0}>
      {/* Threshold is the whole game here: at 0.16 everything above a mid grey
          blooms and the cores smear into white blobs. At 0.34 the pass only
          catches the emissive seams, the chip faces and the brighter stars, so
          the glow reads as neon sitting *on* a dark object.

          `levels` caps the mip chain — the default octave count costs more than
          it visibly buys at this bloom radius. */}
      <Bloom
        mipmapBlur
        levels={4}
        intensity={0.9}
        luminanceThreshold={0.34}
        luminanceSmoothing={0.3}
        radius={0.74}
      />

      <ChromaticAberration offset={aberrationOffset} radialModulation modulationOffset={0.42} />

      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
