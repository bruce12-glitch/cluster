/**
 * Particle shaders.
 *
 * Both particle systems animate entirely inside the vertex shader: twinkle is a
 * pair of detuned sines, and the token streams are a single `mod` that wraps
 * each streak back to the start of its run. The CPU therefore never touches a
 * particle after construction — no per-frame attribute uploads, no garbage.
 *
 * GLSL1 (`attribute` / `varying` / `gl_FragColor`) is intentional: it is three's
 * default dialect for `ShaderMaterial` and needs no version directive.
 *
 * Output is written in the renderer's linear working space. Tone mapping and the
 * sRGB encode both happen later, in the post-processing chain, so nothing here
 * double-converts.
 */

/** Soft, hot-centred point sprite. Shared by both systems. */
export const particleFragmentShader = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec2 offset = gl_PointCoord - vec2(0.5);
    float d2 = dot(offset, offset);

    // Cheap circular clip — square sprites are instantly readable as a bug.
    if (d2 > 0.25) discard;

    float falloff = smoothstep(0.25, 0.0, d2);
    float core = falloff * falloff * falloff * falloff;

    gl_FragColor = vec4(vColor * (0.62 + core * 2.9), falloff * vAlpha);
  }
`

/**
 * The constellation: a static, twinkling shell of star-particles.
 */
export const constellationVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uScale;
  uniform float uMinSize;

  attribute float aSize;
  attribute float aPhase;
  attribute float aTwinkle;
  attribute vec3 aColor;

  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    // Two detuned oscillators so neighbouring stars never beat in lockstep.
    float twinkle = 0.34 + 0.66 * (0.5 + 0.5 * sin(uTime * aTwinkle + aPhase));

    // Inverse-distance attenuation with a pixel floor: the outer shell has to
    // stay visible as fine dust instead of collapsing below one pixel.
    float size = aSize * uScale * uPixelRatio / max(0.001, -mvPosition.z);
    gl_PointSize = max(uMinSize * uPixelRatio, size);

    gl_Position = projectionMatrix * mvPosition;

    vAlpha = twinkle;
    vColor = aColor;
  }
`

/**
 * The token streams: streaks drifting up through the cluster on an infinite
 * loop. The wrap-around is a `mod`, so the field is seamless and stateless.
 */
export const streamVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uScale;
  uniform float uMinSize;
  uniform float uSpan;
  uniform float uHalfSpan;

  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  attribute vec3 aColor;

  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec3 displaced = position;

    // One modulo per vertex per frame — the entire simulation cost.
    float travel = mod(displaced.y + uHalfSpan + uTime * aSpeed, uSpan) - uHalfSpan;
    displaced.y = travel;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);

    // Fade both ends of the run so streaks never pop in or out.
    float envelope = smoothstep(uHalfSpan, uHalfSpan * 0.62, abs(travel));
    float flicker = 0.62 + 0.38 * sin(uTime * 7.0 + aPhase);

    float size = aSize * uScale * uPixelRatio / max(0.001, -mvPosition.z);
    gl_PointSize = max(uMinSize * uPixelRatio, size);

    gl_Position = projectionMatrix * mvPosition;

    vAlpha = envelope * flicker;
    vColor = aColor;
  }
`
