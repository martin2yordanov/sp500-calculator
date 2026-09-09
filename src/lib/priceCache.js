const STORAGE_KEY = 'sp500-price-cache'

/**
 * Last successful SXR8 payload per range, kept so a failed fetch — no
 * network, Yahoo throttling, a cold start in airplane mode — can still show
 * something better than a bare error. This matters more for the native app
 * than the web one: App Store review routinely tests with connectivity off,
 * and a calculator that goes blank the moment the network does looks broken
 * even though the actual math never needed the network at all.
 *
 * Keyed by range because each range is a different series; caching only the
 * active one would make switching tabs offline look like data loss instead of
 * "not fetched yet."
 */

const readAll = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export const readCachedPrice = (range) => {
  const entry = readAll()[range]
  if (!entry?.payload || typeof entry.savedAt !== 'number') return null
  return entry
}

export const writeCachedPrice = (range, payload) => {
  try {
    const all = readAll()
    all[range] = { payload, savedAt: Date.now() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // Best-effort: private-mode Safari and a full quota both land here, and
    // neither should turn a successful fetch into a broken render.
  }
}
