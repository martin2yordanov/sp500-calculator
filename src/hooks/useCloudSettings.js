import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from '../auth/AuthProvider'
import { apiFetch } from '../lib/api'
import { sanitizeSettings } from '../lib/settings'

/**
 * Keeps the signed-in user's settings in step with the server.
 *
 * The two directions are deliberately asymmetric. The pull happens once per
 * sign-in, because that is the moment "my settings from my other phone" is
 * what the user expects. The push is tied to the Запази button rather than to
 * the sliders: a slider fires a change per pixel of travel, and a PUT per
 * pixel is kind neither to the API nor to a phone's battery.
 */
export function useCloudSettings({ onRemoteSettings }) {
  const { enabled, isLoaded, isSignedIn, user, getToken } = useSession()
  const userId = user?.id ?? null

  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  // Clerk hands back a fresh `getToken` on most renders. Depending on it
  // directly would re-run the effect below mid-flight, and its cleanup would
  // abort the very request it is about to skip re-issuing — leaving the panel
  // stuck on "Изтегляне…" forever. The ref keeps the callback current without
  // making it a dependency.
  const getTokenRef = useRef(getToken)
  useEffect(() => {
    getTokenRef.current = getToken
  }, [getToken])

  // Which account has already been pulled. Cleared on sign-out so the next
  // account pulls its own copy.
  const pulledFor = useRef(null)

  useEffect(() => {
    if (!enabled || !isLoaded) return undefined

    if (!isSignedIn || !userId) {
      pulledFor.current = null
      setStatus('idle')
      setError(null)
      return undefined
    }

    if (pulledFor.current === userId) return undefined
    pulledFor.current = userId

    const controller = new AbortController()
    let settled = false

    setStatus('pulling')
    setError(null)

    apiFetch('/api/settings', {
      getToken: () => getTokenRef.current(),
      signal: controller.signal,
    })
      .then((payload) => {
        settled = true
        // A brand-new account has nothing stored yet; leaving the local values
        // alone is what lets the first Запази seed the account.
        if (payload?.settings) onRemoteSettings(sanitizeSettings(payload.settings))
        setStatus('synced')
      })
      .catch((cause) => {
        if (cause.name === 'AbortError') return
        settled = true
        // A failed pull must not be sticky: let the next sign-in try again.
        pulledFor.current = null
        setError(cause.message)
        setStatus('error')
      })

    return () => {
      controller.abort()
      // StrictMode tears this effect down and immediately re-runs it. Without
      // releasing the guard, the second run would see the account as already
      // pulled, skip the request that was just aborted, and leave the panel
      // reading "Изтегляне…" for the rest of the session.
      if (!settled) pulledFor.current = null
    }
  }, [enabled, isLoaded, isSignedIn, userId, onRemoteSettings])

  const push = useCallback(
    async (settings) => {
      if (!enabled || !isSignedIn) return false
      setStatus('pushing')
      setError(null)
      try {
        await apiFetch('/api/settings', {
          getToken: () => getTokenRef.current(),
          method: 'PUT',
          body: { settings },
        })
        setStatus('synced')
        return true
      } catch (cause) {
        setError(cause.message)
        setStatus('error')
        return false
      }
    },
    [enabled, isSignedIn],
  )

  // Stable identity, so passing this down does not re-render the whole tree on
  // every keystroke in an amount field.
  return useMemo(
    () => ({ status, error, push, active: enabled && isSignedIn }),
    [status, error, push, enabled, isSignedIn],
  )
}
