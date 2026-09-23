/**
 * The signed-in user's calculator settings.
 *
 * There is no database behind this. The payload is four bounded numbers, and
 * it lives in the Clerk user's `privateMetadata` — which means deleting the
 * account from the app deletes the settings with it, and no second service has
 * to be provisioned, paid for, or listed in a privacy policy.
 *
 *   GET  /api/settings  ->  { settings: {...} | null }
 *   PUT  /api/settings  <-  { settings: {...} }  ->  { settings: {...} }
 */
import { sanitizeSettings } from '../shared/settings-schema.js'
import { clerkClient, requireUserId } from './_lib/clerk-auth.js'
import { HttpError, applyCors, sendError } from './_lib/http.js'

const METADATA_KEY = 'sp500Settings'

export default async function handler(req, res) {
  if (applyCors(req, res, 'GET, PUT')) return

  // These are per-user and must never be held by a shared cache.
  res.setHeader('Cache-Control', 'private, no-store')

  try {
    if (req.method !== 'GET' && req.method !== 'PUT') {
      throw new HttpError(405, 'Методът не се поддържа.')
    }

    const userId = await requireUserId(req)
    const clerk = clerkClient()

    if (req.method === 'GET') {
      const user = await clerk.users.getUser(userId)
      const stored = user.privateMetadata?.[METADATA_KEY]
      // A never-saved account answers with null rather than with defaults, so
      // the app can tell "nothing stored yet" from "stored the defaults".
      res.status(200).json({ settings: stored ? sanitizeSettings(stored) : null })
      return
    }

    const body = typeof req.body === 'string' ? safeParse(req.body) : req.body
    if (!body?.settings || typeof body.settings !== 'object') {
      throw new HttpError(400, 'Липсват настройки в заявката.')
    }

    // Clamped again here: the client's own validation is a convenience, not a
    // guarantee, and this endpoint is reachable without it.
    const settings = sanitizeSettings(body.settings)

    // `updateUserMetadata` merges at the top level of privateMetadata;
    // `updateUser` would replace it wholesale and drop anything Clerk or a
    // future feature keeps alongside this key.
    await clerk.users.updateUserMetadata(userId, {
      privateMetadata: { [METADATA_KEY]: settings },
    })

    res.status(200).json({ settings })
  } catch (cause) {
    sendError(res, cause)
  }
}

const safeParse = (raw) => {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
