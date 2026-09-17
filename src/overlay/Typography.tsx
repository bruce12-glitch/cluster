/**
 * The landing typography.
 *
 * Everything here is `pointer-events-none`, purely decorative HTML stacked over
 * the canvas. There is deliberately no navigation, no control surface and no
 * call to action — the only "interface" is the composition itself.
 *
 * Two layout decisions are load-bearing:
 *
 *  - **The block is width-capped, not just left-aligned.** The monument owns the
 *    horizontal centre of the frame, so the headline is broken into three
 *    deliberate lines that resolve into the full
 *    "INFINITUM-8 // ML INFERENCE CLUSTER" string without ever reaching into the
 *    chassis and colliding with the glowing cores.
 *  - **Placement and drift live on separate elements.** The outer element owns
 *    the static placement (including the `-translate-y-1/2` centring); the inner
 *    one owns the drift animation. On a single element the running `transform`
 *    keyframes would clobber the centring transform.
 *
 * Motion is CSS-only (an entrance lift, a slow drift, a blinking caret) so the
 * overlay never competes with the render loop for frame time.
 */
export function Typography() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 select-none">
      {/* ------------------------------------------- corner registration marks */}
      <div
        className="animate-lift absolute right-6 top-6 text-right text-[9px] leading-[2] tracking-[0.42em] text-muted/70 sm:right-10 sm:top-10 lg:right-16"
        style={{ animationDelay: '1100ms' }}
      >
        SEC_00
        <br />
        NODE_08
      </div>

      <div
        className="animate-lift absolute bottom-6 left-6 text-[9px] tracking-[0.42em] text-muted/55 sm:bottom-10 sm:left-10 lg:left-16"
        style={{ animationDelay: '1250ms' }}
      >
        REAL-TIME RASTER
      </div>

      <div
        className="animate-lift absolute bottom-6 right-6 text-right text-[9px] tracking-[0.42em] text-muted/55 sm:bottom-10 sm:right-10 lg:right-16"
        style={{ animationDelay: '1250ms' }}
      >
        8× ARITHMETIC CORES
      </div>

      {/* -------------------------------------------------------- the monument */}
      {/* The cap is viewport-relative as well as absolute: on a 1024px laptop a
          fixed 26rem column would reach into the chassis, so it is held to 32%
          of the width there and allowed to reach 26rem on a wide desktop. */}
      <div className="absolute bottom-16 left-6 right-6 sm:bottom-auto sm:left-10 sm:right-auto sm:top-1/2 sm:max-w-[min(26rem,32vw)] sm:-translate-y-1/2 lg:left-16">
        <div className="animate-drift">
          <p
            className="animate-lift text-[10px] leading-none tracking-[0.5em] text-core/70"
            style={{ animationDelay: '300ms' }}
          >
            INFERENCE FABRIC
          </p>

          <h1
            className="animate-lift title-bloom mt-5 font-extralight leading-[1.3] tracking-[0.18em] text-ink"
            style={{ animationDelay: '440ms', fontSize: 'clamp(1.15rem, 2.15vw, 2.15rem)' }}
          >
            <span className="block">INFINITUM-8 //</span>
            <span className="block">ML INFERENCE</span>
            <span className="block">CLUSTER</span>
          </h1>

          <div
            className="animate-lift mt-7 flex items-center gap-4"
            style={{ animationDelay: '640ms' }}
          >
            <span className="h-px w-14 shrink-0 bg-gradient-to-r from-core/80 to-transparent" />
            <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>

          <p
            className="animate-lift mt-6 max-w-sm text-[11px] leading-[1.95] tracking-[0.14em] text-muted sm:text-xs"
            style={{ animationDelay: '780ms' }}
          >
            A low-level spatial exploration of high-intensity arithmetic pipelines.
          </p>

          <span
            className="animate-blink mt-8 block h-3.5 w-[2px] bg-core"
            style={{ animationDelay: '1400ms' }}
          />
        </div>
      </div>
    </div>
  )
}
