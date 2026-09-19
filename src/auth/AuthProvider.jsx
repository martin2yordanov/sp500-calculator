import { createContext, useContext, useMemo } from 'react'
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-react'
import { authEnabled, publishableKey } from './config'
import { clerkInstance, forgetNativeSession } from './clerkInstance'
import { isNative } from '../lib/api'

/**
 * What the app is allowed to know about the session.
 *
 * Nothing outside `src/auth` imports Clerk directly. That keeps the swap cost
 * of the provider down to this folder, and it means the rest of the app has a
 * single shape to handle whether auth is configured, loading, or off.
 */
const SIGNED_OUT = {
  enabled: false,
  isLoaded: true,
  isSignedIn: false,
  user: null,
  getToken: async () => null,
  signOut: async () => {},
}

const SessionContext = createContext(SIGNED_OUT)

export const useSession = () => useContext(SessionContext)

function SessionBridge({ children }) {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth()
  const { user } = useUser()

  const value = useMemo(
    () => ({
      enabled: true,
      isLoaded,
      isSignedIn: Boolean(isSignedIn),
      user: user
        ? {
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress ?? null,
            name: user.fullName || user.firstName || null,
            imageUrl: user.hasImage ? user.imageUrl : null,
          }
        : null,
      getToken,
      signOut: async () => {
        await signOut()
        await forgetNativeSession()
      },
    }),
    [isLoaded, isSignedIn, user, getToken, signOut],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function AuthProvider({ children }) {
  // `authEnabled` is fixed when the bundle is built, so this branch never
  // flips between renders and the hooks below it keep a stable order.
  if (!authEnabled) {
    return <SessionContext.Provider value={SIGNED_OUT}>{children}</SessionContext.Provider>
  }

  return (
    <ClerkProvider
      Clerk={clerkInstance}
      publishableKey={publishableKey}
      // Clerk's own docs: on native platforms this must be false, or clerk-js
      // assumes it can set cookies and the session never survives a request.
      standardBrowser={!isNative()}
      // There is no router here; after sign-out the app just re-renders.
      afterSignOutUrl={isNative() ? undefined : '/'}
    >
      <SessionBridge>{children}</SessionBridge>
    </ClerkProvider>
  )
}
