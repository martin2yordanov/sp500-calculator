import { Capacitor } from '@capacitor/core'

/**
 * Base URL prefixed onto every API call.
 *
 * On the web this is empty on purpose: Vercel serves the static build and
 * `/api/sxr8` from the same origin, so a relative path is both correct and
 * immune to ever pointing at the wrong deployment (a preview build calls its
 * own preview's function, production calls its own).
 *
 * The native iOS/Android shell has no such origin — Capacitor serves the
 * bundled `dist/` from a local scheme, where no serverless function exists.
 * `VITE_API_BASE_URL` is baked in at build time for that target only (see the
 * `build:native` script in package.json) and points at the deployed API.
 */
export const API_BASE = String(import.meta.env.VITE_API_BASE_URL ?? '')
  .trim()
  .replace(/\/+$/, '')

export const isNative = () => Capacitor.isNativePlatform()

/**
 * A native build without a base URL resolves `/api/sxr8` against the app
 * bundle, so the request never leaves the device and fails as an opaque
 * parse error. Saying so is worth more than a relative path that cannot work.
 */
export const apiUrl = (path) => {
  const suffix = path.startsWith('/') ? path : `/${path}`
  if (API_BASE) return `${API_BASE}${suffix}`
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

  if (!response.ok) throw new Error(payload?.error ?? `HTTP ${response.status}`)

  return payload
}
