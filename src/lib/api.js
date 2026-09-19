import { Capacitor } from '@capacitor/core'

const BASE = String(import.meta.env.VITE_API_BASE_URL ?? '')
  .trim()
  .replace(/\/+$/, '')

export const isNative = () => Capacitor.isNativePlatform()

/**
 * On the web the app and the functions share an origin, so a relative path is
 * enough. Inside the iOS WebView the bundle is served from `https://localhost`,
 * where `/api/sxr8` resolves against the app bundle and never leaves the
 * device — so a native build has to be compiled with VITE_API_BASE_URL set to
 * the deployment that hosts the functions.
 */
export function apiUrl(path) {
  const suffix = path.startsWith('/') ? path : `/${path}`
  if (BASE) return `${BASE}${suffix}`
  if (isNative()) {
    throw new Error(
      'Липсва VITE_API_BASE_URL — native билдът не знае къде се хостват функциите.',
    )
  }
  return suffix
}

/**
 * `fetch` with the Clerk session token attached and JSON handled.
 *
 * `getToken` is passed in rather than imported so this module stays free of
 * React and of Clerk itself; the caller already holds the session.
 */
export async function apiFetch(path, { getToken, body, method = 'GET', signal } = {}) {
  const headers = { Accept: 'application/json' }

  if (getToken) {
    const token = await getToken()
    if (!token) throw new Error('Сесията изтече — влез отново.')
    headers.Authorization = `Bearer ${token}`
  }

  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const response = await fetch(apiUrl(path), {
    method,
    headers,
    signal,
    body: body === undefined ? undefined : JSON.stringify(body),
    // The WebView origin differs from the API origin, and nothing here relies
    // on cookies — the session travels in the Authorization header.
    credentials: 'omit',
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.error ?? `HTTP ${response.status}`)
  }

  return payload
}
