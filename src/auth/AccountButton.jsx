import { useState } from 'react'
import { useSession } from './AuthProvider'
import AccountSheet from './AccountSheet'
import SignInSheet from './SignInSheet'

/**
 * The only auth affordance in the layout. It renders nothing at all when the
 * build has no Clerk key, so an unconfigured clone shows no dead button.
 */
export default function AccountButton({ sync }) {
  const { enabled, isLoaded, isSignedIn, user } = useSession()
  const [open, setOpen] = useState(false)

  if (!enabled) return null

  const label = isSignedIn ? (user?.email ?? 'Акаунт') : 'Вход'

  return (
    <>
      <button
        type="button"
        className="account-btn"
        onClick={() => setOpen(true)}
        disabled={!isLoaded}
        aria-haspopup="dialog"
      >
        {isSignedIn && user?.imageUrl ? (
          <img className="account-btn-avatar" src={user.imageUrl} alt="" />
        ) : (
          <span className="account-btn-dot" aria-hidden="true" />
        )}
        <span className="account-btn-label">{label}</span>
      </button>

      {open &&
        (isSignedIn ? (
          <AccountSheet sync={sync} onClose={() => setOpen(false)} />
        ) : (
          <SignInSheet onClose={() => setOpen(false)} />
        ))}
    </>
  )
}
