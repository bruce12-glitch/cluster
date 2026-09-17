/**
 * The atmosphere layer.
 *
 * Three stacked, pointer-transparent plates that sit between the render and the
 * typography: a vignette to bury the frame edges, hairline scanlines for display
 * texture, and animated film grain so the blacks never look digitally flat.
 *
 * All of it is CSS compositing — no extra render pass, no extra draw call.
 */
export function Atmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      <div className="atmo-vignette absolute inset-0" />
      <div className="atmo-scanlines absolute inset-0 opacity-60" />
      <div className="atmo-grain absolute inset-0" />

      {/* Cinematic falloff at the top and bottom edges, so the composition has
          a centre of gravity even on very tall or very wide viewports. The
          bottom plate is deeper on small screens, where the re-framed camera
          puts the energy floor behind the headline. */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-void/75 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-void/92 via-void/55 to-transparent sm:h-44 sm:from-void/85 sm:via-transparent" />

      {/* Legibility scrim. The cluster orbits and the camera drifts, so the
          monument's silhouette can slide across the left third of the frame.
          This keeps the headline's contrast stable no matter where it lands. */}
      <div className="absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-void via-void/55 to-transparent" />
    </div>
  )
}
