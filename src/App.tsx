import { Atmosphere } from './overlay/Atmosphere'
import { Typography } from './overlay/Typography'
import { Experience } from './scene/Experience'

/**
 * The Infinitum Node.
 *
 * Three layers, in paint order:
 *   1. `Experience` — the WebGL render, filling the viewport
 *   2. `Atmosphere` — vignette, scanlines and grain over the render
 *   3. `Typography` — the landing copy, and nothing else
 *
 * Plus a black plate on top that fades away on load, so the page arrives out of
 * the void instead of popping into existence.
 */
export default function App() {
  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-void">
      <Experience />
      <Atmosphere />
      <Typography />

      <div className="animate-unveil pointer-events-none absolute inset-0 z-30 bg-void" />
    </main>
  )
}
