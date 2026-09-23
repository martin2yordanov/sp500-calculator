import { createClerkClient, verifyToken } from '@clerk/backend'
import { HttpError } from './http.js'

const secretKey = process.env.CLERK_SECRET_KEY ?? ''

export const clerkConfigured = secretKey.length > 0

/**
 * Restricts which `azp` claims are accepted, so a token minted for another
 * site cannot be replayed against this API. Set it to the deployment origin
 * plus `https://localhost` for the iOS build. Left empty the check is skipped,
 * which keeps a first deploy working before the value is known.
 */
const authorizedParties = String(process.env.CLERK_AUTHORIZED_PARTIES ?? '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean)

let cached = null

export function clerkClient() {
  if (!clerkConfigured) throw new HttpError(503, 'Синхронизацията не е настроена.')
  cached ??= createClerkClient({ secretKey })
  return cached
}

/** The Clerk user id behind the Bearer token, or a 401. */
export async function requireUserId(req) {
  if (!clerkConfigured) throw new HttpError(503, 'Синхронизацията не е настроена.')

  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) throw new HttpError(401, 'Липсва сесиен токен.')

  let payload
  try {
    payload = await verifyToken(token, {
      secretKey,
      ...(authorizedParties.length ? { authorizedParties } : {}),
    })
  } catch {
    // The reason (expired, wrong signature, wrong party) is deliberately not
    // reflected back to the caller.
    throw new HttpError(401, 'Невалидна или изтекла сесия.')
  }

  if (!payload?.sub) throw new HttpError(401, 'Невалидна или изтекла сесия.')
  return payload.sub
}
