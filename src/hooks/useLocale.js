import { useCallback, useEffect, useState } from 'react'
import {
  deviceLocale,
  initialLocale,
  readStoredLocale,
  storeLocale,
} from '../lib/i18n'

/**
 * Current UI language, the setter, and the one side effect that needs to
 * happen outside React: `<html lang>` should match what is actually on
 * screen for screen readers and search indexing.
 *
 * Unlike the theme, the locale has no pre-paint script in index.html — there
 * is no flash to prevent. A wrong-language guess for one React render is a
 * word swap, not a jarring dark/light flicker, so resolving it after mount is
 * fine.
 */
export function useLocale() {
  const [locale, setLocale] = useState(initialLocale)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  // Mirrors useTheme: follow the device language until the visitor picks one
  // explicitly, then stop overriding their choice. There is no
  // matchMedia-style change event for navigator.language, so this only
  // re-checks on focus — good enough for "the phone's language changed while
  // the app was in the background," which is the realistic case.
  useEffect(() => {
    const onFocus = () => {
      if (!readStoredLocale()) setLocale(deviceLocale())
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const toggle = useCallback(() => {
    setLocale((current) => {
      const next = current === 'bg' ? 'en' : 'bg'
      storeLocale(next)
      return next
    })
  }, [])

  return { locale, toggle }
}
