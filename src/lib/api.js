/**
 * Base URL prefixed onto every API call.
 *
 * On the web this is empty on purpose: Vercel serves the static build and
 * `/api/sxr8` from the same origin, so a relative path is both correct and
 * immune to ever pointing at the wrong deployment (a preview build calls its
 * own preview's function, production calls its own).
 *
 * The native iOS/Android shell has no such origin — Capacitor serves the
 * bundled `dist/` from `capacitor://localhost` (iOS) or a local scheme
 * (Android), where no serverless function exists. `VITE_API_BASE_URL` is
 * baked in at build time for that target only (see capacitor.config.ts and
 * the `build:native` script in package.json) and points at the deployed API.
 */
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export const apiUrl = (path) => `${API_BASE}${path}`
