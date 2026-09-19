import { App as CapacitorApp } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { isNative } from '../lib/native'
import { NATIVE_SSO_REDIRECT, WEB_SSO_PATH } from './config'

/** Five minutes is longer than any real Apple/Google consent screen takes. */
const SSO_TIMEOUT_MS = 5 * 60 * 1000

export class SsoCancelled extends Error {
  constructor() {
    super('Входът беше прекратен.')
    this.name = 'SsoCancelled'
  }
}

/**
 * Opens the provider's consent page in the system browser and resolves with
 * the URL iOS hands back through the app's custom scheme.
 *
 * SFSafariViewController shares cookies with Safari, so someone already signed
 * in to Google on the phone goes straight through — which an in-app WebView
 * would not allow, and which Google blocks outright for OAuth anyway.
 */
function openAndAwaitRedirect(url) {
  return new Promise((resolve, reject) => {
    let settled = false
    let urlHandle = null
    let finishHandle = null
    let timer = null

    const settle = (fn, value) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      Promise.allSettled([urlHandle?.remove(), finishHandle?.remove()]).then(() =>
        fn(value),
      )
    }

    // Both listeners are registered asynchronously, so each one has to check
    // whether the race was already decided before it finished attaching.
    CapacitorApp.addListener('appUrlOpen', ({ url: opened }) => {
      if (!opened?.startsWith(NATIVE_SSO_REDIRECT)) return
      Browser.close().catch(() => {})
      settle(resolve, opened)
    }).then((handle) => {
      urlHandle = handle
      if (settled) handle.remove()
    })

    Browser.addListener('browserFinished', () => {
      // Only reached when the user dismissed the sheet themselves: the success
      // path closes the browser after `settled` is already true.
      settle(reject, new SsoCancelled())
    }).then((handle) => {
      finishHandle = handle
      if (settled) handle.remove()
    })

    timer = setTimeout(
      () => settle(reject, new Error('Изтече времето за вход.')),
      SSO_TIMEOUT_MS,
    )

    Browser.open({
      url,
      presentationStyle: 'popover',
      toolbarColor: '#080808',
    }).catch((cause) => settle(reject, cause))
  })
}

async function nativeSso({ strategy, signIn, signUp, setActive }) {
  await signIn.create({ strategy, redirectUrl: NATIVE_SSO_REDIRECT })

  const target = signIn.firstFactorVerification?.externalVerificationRedirectURL
  if (!target) throw new Error('Clerk не върна адрес за вход.')

  const returned = await openAndAwaitRedirect(target.toString())

  // Clerk hands back a one-shot nonce so the native client can pick up the
  // client token that was rotated while control was outside the app.
  const nonce = new URL(returned).searchParams.get('rotating_token_nonce')
  await signIn.reload(nonce ? { rotatingTokenNonce: nonce } : undefined)

  if (signIn.status === 'complete' && signIn.createdSessionId) {
    await setActive({ session: signIn.createdSessionId })
    return 'complete'
  }

  // First time this Apple or Google identity is seen, Clerk marks the sign-in
  // "transferable" and expects the account to be created out of it.
  if (signIn.firstFactorVerification?.status === 'transferable') {
    await signUp.create({ transfer: true })
    if (signUp.status === 'complete' && signUp.createdSessionId) {
      await setActive({ session: signUp.createdSessionId })
      return 'complete'
    }
    return signUp.status ?? 'incomplete'
  }

  return signIn.status ?? 'incomplete'
}

/**
 * `oauth_apple` / `oauth_google`. Resolves to 'complete' when a session is
 * live, 'redirecting' when the browser is about to navigate away, or the
 * Clerk status when the provider needs more from the user.
 */
export async function startSso({ strategy, signIn, signUp, setActive }) {
  if (isNative()) return nativeSso({ strategy, signIn, signUp, setActive })

  // On the web the page itself leaves and comes back to WEB_SSO_PATH, where
  // <SsoCallback/> finishes the handshake.
  await signIn.authenticateWithRedirect({
    strategy,
    redirectUrl: WEB_SSO_PATH,
    redirectUrlComplete: '/',
  })
  return 'redirecting'
}
