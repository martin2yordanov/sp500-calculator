import { useState } from 'react'
import { useSession } from './AuthProvider'
import AccountSheet from './AccountSheet'
import SignInSheet from './SignInSheet'
import { t } from '../lib/i18n'

/** Head and shoulders, drawn inline so it inherits currentColor with the row. */
function PersonGlyph() {
  return (
    <svg
      className="account-btn-glyph"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20.2a7.2 7.2 0 0 1 14.4 0" />
    </svg>
  )
}

/**
 * The only auth affordance in the layout. It renders nothing at all when the
 * build has no Clerk key, so an unconfigured clone shows no dead button.
 */
export default function AccountButton({ locale, sync }) {
  const { enabled, isLoaded, isSignedIn, user } = useSession()
  const [open, setOpen] = useState(false)

  if (!enabled) return null

  const label = isSignedIn ? t(locale, 'authAccount') : t(locale, 'authSignIn')
  const initial = (user?.email ?? user?.name ?? '?').charAt(0).toUpperCase()

  return (
    <>
      <button
        type="button"
        className="account-btn"
        onClick={() => setOpen(true)}
        disabled={!isLoaded}
        aria-haspopup="dialog"
        aria-label={label}
        title={isSignedIn ? (user?.email ?? label) : label}
      >
        {isSignedIn ? (
          user?.imageUrl ? (
            <img className="account-btn-avatar" src={user.imageUrl} alt="" />
          ) : (
            <span className="account-btn-initial" aria-hidden="true">
              {initial}
            </span>
          )
        ) : (
          <PersonGlyph />
        )}
      </button>

      {open &&
        (isSignedIn ? (
          <AccountSheet locale={locale} sync={sync} onClose={() => setOpen(false)} />
        ) : (
          <SignInSheet locale={locale} onClose={() => setOpen(false)} />
        ))}
    </>
  )
}
