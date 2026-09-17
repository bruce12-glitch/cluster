import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function readPreference(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(QUERY).matches
}

/**
 * Honours the OS "reduce motion" setting.
 *
 * The monument never stops — that would defeat the piece — but the orbit,
 * parallax and camera drift are all dialled right down so the page becomes a
 * near-still composition for anyone who needs it.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(readPreference)

  useEffect(() => {
    const media = window.matchMedia(QUERY)
    const handleChange = () => setReduced(media.matches)

    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  return reduced
}
