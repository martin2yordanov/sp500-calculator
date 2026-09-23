import { Preferences } from '@capacitor/preferences'

/**
 * Where the Clerk client JWT lives on a device.
 *
 * In a browser Clerk keeps its client token in a cookie. Inside WKWebView the
 * app is served from `https://localhost` while Clerk's API answers from
 * another origin, so that cookie is third-party and iOS drops it. Native mode
 * therefore carries the token in an Authorization header, and it has to be
 * persisted somewhere — otherwise every cold start signs the user out.
 *
 * Capacitor Preferences maps to UserDefaults, which is inside the app sandbox
 * but is included in unencrypted device backups. That is an acceptable trade
 * for a settings-sync token and nothing more; if this app ever stores anything
 * sensitive, swap this module for a Keychain-backed plugin — the rest of the
 * auth code only knows these three methods.
 */
export const CLIENT_JWT_KEY = '__clerk_client_jwt'

export const tokenCache = {
  async get(key) {
    try {
      const { value } = await Preferences.get({ key })
      return value ?? null
    } catch {
      return null
    }
  },

  async set(key, value) {
    try {
      await Preferences.set({ key, value })
    } catch {
      // A failed write costs the user a re-login, not a broken app.
    }
  },

  async remove(key) {
    try {
      await Preferences.remove({ key })
    } catch {
      // Same reasoning as above.
    }
  },
}
