import { useCallback, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import Sheet from './Sheet'
import { useSession } from './AuthProvider'
import { messageOf } from './errors'
import { forgetNativeSession } from './clerkInstance'
import { t } from '../lib/i18n'

const SYNC_KEY = {
  idle: 'syncIdle',
  pulling: 'syncPulling',
  pushing: 'syncPushing',
  synced: 'syncSynced',
  error: 'syncError',
}

export default function AccountSheet({ locale, onClose, sync }) {
  const { user: profile, signOut } = useSession()
  const { user } = useUser()

  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const handleSignOut = useCallback(async () => {
    setBusy('signOut')
    setError(null)
    try {
      await signOut()
      onClose()
    } catch (cause) {
      setError(messageOf(cause, locale))
      setBusy(null)
    }
  }, [signOut, onClose, locale])

  const handleDelete = useCallback(async () => {
    setBusy('delete')
    setError(null)
    try {
      // Deleting the Clerk user takes the stored settings with it: they live
      // in that user's metadata, not in a table of our own.
      await user.delete()
      await forgetNativeSession()
      onClose()
    } catch (cause) {
      setError(messageOf(cause, locale))
      setBusy(null)
    }
  }, [user, onClose, locale])

  return (
    <Sheet title={t(locale, 'authAccount')} locale={locale} onClose={onClose}>
      <div className="account-identity">
        {profile?.imageUrl ? (
          <img className="account-avatar" src={profile.imageUrl} alt="" />
        ) : (
          <span className="account-avatar account-avatar--letter" aria-hidden="true">
            {(profile?.email ?? '?').charAt(0).toUpperCase()}
          </span>
        )}
        <div className="account-identity-text">
          {profile?.name && <div className="account-name">{profile.name}</div>}
          <div className="account-email">
            {profile?.email ?? t(locale, 'authNoEmail')}
          </div>
        </div>
      </div>

      <p className="sheet-lede" role="status" aria-live="polite">
        {t(locale, SYNC_KEY[sync?.status] ?? 'syncIdle')}
        {sync?.status === 'error' && sync.error ? ` (${sync.error})` : ''}
      </p>

      <button
        type="button"
        className="sheet-submit sheet-submit--quiet"
        onClick={handleSignOut}
        disabled={busy !== null}
      >
        {busy === 'signOut' ? t(locale, 'authSigningOut') : t(locale, 'authSignOut')}
      </button>

      {/* App Store guideline 5.1.1(v): an app that lets people create an
          account must let them delete it from inside the app, not only from a
          website. */}
      <div className="account-danger">
        {confirmingDelete ? (
          <>
            <p className="account-danger-warning">{t(locale, 'authDeleteWarning')}</p>
            <div className="account-danger-actions">
              <button
                type="button"
                className="sheet-submit sheet-submit--danger"
                onClick={handleDelete}
                disabled={busy !== null}
              >
                {busy === 'delete'
                  ? t(locale, 'authDeleting')
                  : t(locale, 'authDeleteConfirm')}
              </button>
              <button
                type="button"
                className="sheet-link"
                onClick={() => setConfirmingDelete(false)}
                disabled={busy !== null}
              >
                {t(locale, 'authCancel')}
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className="sheet-link sheet-link--danger"
            onClick={() => setConfirmingDelete(true)}
            disabled={busy !== null}
          >
            {t(locale, 'authDelete')}
          </button>
        )}
      </div>

      {error && (
        <p className="sheet-error" role="alert">
          {error}
        </p>
      )}
    </Sheet>
  )
}
