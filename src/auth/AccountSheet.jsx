import { useCallback, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import Sheet from './Sheet'
import { useSession } from './AuthProvider'
import { messageOf } from './errors'
import { forgetNativeSession } from './clerkInstance'

const SYNC_TEXT = {
  idle: 'Настройките се пазят при натискане на „Запази“.',
  pulling: 'Изтегляне на запазените настройки…',
  pushing: 'Запазване в облака…',
  synced: 'Настройките са синхронизирани.',
  error: 'Синхронизацията не успя.',
}

export default function AccountSheet({ onClose, sync }) {
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
      setError(messageOf(cause))
      setBusy(null)
    }
  }, [signOut, onClose])

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
      setError(messageOf(cause))
      setBusy(null)
    }
  }, [user, onClose])

  return (
    <Sheet title="Акаунт" onClose={onClose}>
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
          <div className="account-email">{profile?.email ?? 'Без имейл'}</div>
        </div>
      </div>

      <p className="sheet-lede" role="status" aria-live="polite">
        {SYNC_TEXT[sync?.status] ?? SYNC_TEXT.idle}
        {sync?.status === 'error' && sync.error ? ` (${sync.error})` : ''}
      </p>

      <button
        type="button"
        className="sheet-submit sheet-submit--quiet"
        onClick={handleSignOut}
        disabled={busy !== null}
      >
        {busy === 'signOut' ? 'Излизане…' : 'Изход'}
      </button>

      {/* App Store guideline 5.1.1(v): an app that lets people create an
          account must let them delete it from inside the app, not only from a
          website. */}
      <div className="account-danger">
        {confirmingDelete ? (
          <>
            <p className="account-danger-warning">
              Това изтрива акаунта и запазените настройки завинаги. Действието е
              необратимо.
            </p>
            <div className="account-danger-actions">
              <button
                type="button"
                className="sheet-submit sheet-submit--danger"
                onClick={handleDelete}
                disabled={busy !== null}
              >
                {busy === 'delete' ? 'Изтриване…' : 'Да, изтрий акаунта'}
              </button>
              <button
                type="button"
                className="sheet-link"
                onClick={() => setConfirmingDelete(false)}
                disabled={busy !== null}
              >
                Отказ
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
            Изтрий акаунта
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
