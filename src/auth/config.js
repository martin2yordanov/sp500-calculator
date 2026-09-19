import capacitorConfig from '../../capacitor.config.json'

export const publishableKey = String(
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? '',
).trim()

/**
 * Auth is opt-in at build time. Without a key the calculator still works in
 * full — it simply never offers to sign in — so a fresh clone runs before
 * anyone has touched a Clerk dashboard.
 */
export const authEnabled = publishableKey.length > 0

/**
 * Derived from the Capacitor app id so the two cannot drift. The same string
 * is registered as a CFBundleURLScheme in ios/App/App/Info.plist; change one
 * and the OAuth round trip silently stops coming back.
 */
export const APP_SCHEME = capacitorConfig.appId

/** Where Apple/Google return to after the system browser finishes. */
export const NATIVE_SSO_REDIRECT = `${APP_SCHEME}://sso-callback`

/** The web equivalent — a real path, served by the SPA rewrite in vercel.json. */
export const WEB_SSO_PATH = '/sso-callback'
