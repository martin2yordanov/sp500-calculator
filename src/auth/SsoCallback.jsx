import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react'

/**
 * The landing spot for the web OAuth round trip. Apple and Google send the
 * browser back to /sso-callback with the grant in the query string; this
 * headless component hands it to Clerk and then navigates home.
 *
 * Native builds never reach this screen — there the redirect comes back
 * through the app's custom URL scheme and is handled in ssoFlow.js.
 */
export default function SsoCallback() {
  return (
    <div className="boot" role="status" aria-live="polite">
      <p className="boot-text">…</p>
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/"
        signUpFallbackRedirectUrl="/"
      />
    </div>
  )
}
