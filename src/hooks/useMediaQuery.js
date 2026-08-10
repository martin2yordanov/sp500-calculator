import { useEffect, useState } from 'react'

/**
 * Chart margins and tick counts are props, not CSS, so a couple of layout
 * decisions have to be made in JS. This keeps them in sync with the
 * breakpoints used in styles.css.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const list = window.matchMedia(query)
    const onChange = (event) => setMatches(event.matches)
    setMatches(list.matches)
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}
