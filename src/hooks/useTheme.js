import { useCallback, useEffect, useState } from 'react'
import {
  THEME_COLOR,
  initialTheme,
  readStoredTheme,
  storeTheme,
  systemTheme,
} from '../lib/theme'

/**
 * Current theme, the setter, and the side effects that keep the document in
 * step: `data-theme` for the CSS token overrides and the `theme-color` meta for
 * the browser chrome.
 *
 * The attribute is also written by an inline script in index.html before the
 * bundle parses, so a light-preferring visitor never sees a dark first paint.
 * Re-applying it here is what makes the toggle work after that.
 */
export function useTheme() {
  const [theme, setTheme] = useState(initialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', THEME_COLOR[theme])
  }, [theme])

  // Follow the OS while the visitor has not chosen for themselves. Once they
  // press the toggle, a stored value exists and the system stops overriding it.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => {
      if (!readStoredTheme()) setTheme(systemTheme())
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark'
      storeTheme(next)
      return next
    })
  }, [])

  return { theme, toggle }
}
