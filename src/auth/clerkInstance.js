// `no-rhc` = "no remote hosted code": a clerk-js build that carries everything
// it needs instead of pulling further script from Clerk's CDN at runtime.
// That matters twice over here — App Store review rejects apps that download
// and execute code (guideline 2.5.2), and the bundle is roughly half the size
// of the default one because the prebuilt UI components are left out. This app
// draws its own sign-in screen, so nothing is lost.
import { Clerk } from '@clerk/clerk-js/no-rhc'
import { authEnabled, publishableKey } from './config'
import { isNative } from '../lib/api'
import { CLIENT_JWT_KEY, tokenCache } from './tokenCache'

/**
 * Teaches clerk-js to authenticate the way a native client has to: no cookies,
 * a `_is_native=1` marker so Clerk's API answers with a token instead of a
 * Set-Cookie, and the rotating client JWT carried in an Authorization header
 * and persisted between launches.
 */
function useHeaderTransport(clerk) {
  clerk.__internal_onBeforeRequest(async (request) => {
    request.credentials = 'omit'
    request.url?.searchParams.append('_is_native', '1')

    const jwt = await tokenCache.get(CLIENT_JWT_KEY)
    const headers = new Headers(request.headers ?? {})
    headers.set('authorization', jwt ?? '')
    request.headers = headers
  })

  clerk.__internal_onAfterResponse(async (_request, response) => {
    // Clerk rotates this token on most responses; missing the rotation is what
    // makes a native session mysteriously expire mid-use.
    const authorization = response?.headers?.get('authorization')
    if (authorization) await tokenCache.set(CLIENT_JWT_KEY, authorization)
  })
}

/**
 * One instance for the lifetime of the app. It is built here rather than left
 * to ClerkProvider because the transport hooks have to be attached before
 * `load()` fires the first request.
 */
export const clerkInstance = (() => {
  if (!authEnabled) return null
  const clerk = new Clerk(publishableKey)
  if (isNative()) useHeaderTransport(clerk)
  return clerk
})()

/** Called after sign-out so the next launch starts from a clean client. */
export const forgetNativeSession = () =>
  isNative() ? tokenCache.remove(CLIENT_JWT_KEY) : Promise.resolve()
