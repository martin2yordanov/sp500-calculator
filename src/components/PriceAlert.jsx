import { useCallback, useEffect, useState } from 'react'
import { LocalNotifications } from '@capacitor/local-notifications'
import { apiUrl } from '../lib/api'
import { formatEur } from '../lib/format'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import { t } from '../lib/i18n'
import { armAlert, isTriggered, readAlert, writeAlert } from '../lib/priceAlert'

// Plain paths rather than an icon font or emoji — same reasoning as the
// Sun/Moon icons in ThemeToggle.
const Bell = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M12 2.5c-.83 0-1.5.67-1.5 1.5v.6C7.9 5.2 6 7.6 6 10.5v4.4l-1.6 2.1c-.4.5 0 1.3.6 1.3h14c.6 0 1-.8.6-1.3L18 14.9v-4.4c0-2.9-1.9-5.3-4.5-5.9V4c0-.83-.67-1.5-1.5-1.5z"
    />
    <path fill="currentColor" d="M9.5 20a2.5 2.5 0 0 0 5 0h-5z" />
  </svg>
)

// Independent of Sxr8Chart's own fetch/cache, and only runs at all while an
// alert is armed: a visitor who leaves the app open on an unchanged chart
// tab still needs the price re-checked, but a visitor who never sets an
// alert should not pay for a recurring fetch they get no benefit from.
const POLL_MS = 5 * 60 * 1000

export default function PriceAlert({ price, locale }) {
  const [alert, setAlert] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [inputText, setInputText] = useState('')
  const [triggered, setTriggered] = useState(null)

  useEffect(() => {
    setAlert(readAlert())
  }, [])

  const fire = useCallback(
    async (hitPrice) => {
      writeAlert(null)
      setAlert(null)
      setTriggered({ price: hitPrice })
      hapticSuccess()
      try {
        // checkPermissions() never prompts, so this cannot surprise anyone
        // with a system dialog at an arbitrary moment — that already
        // happened, if it was going to, when the alert was armed.
        const { display } = await LocalNotifications.checkPermissions()
        if (display === 'granted') {
          await LocalNotifications.schedule({
            notifications: [
              {
                id: Date.now() % 2147483647,
                title: t(locale, 'priceAlertTriggeredTitle'),
                body: t(locale, 'priceAlertTriggeredBody', { price: formatEur(hitPrice, locale) }),
              },
            ],
          })
        }
      } catch {
        // No system-notification support on this platform/browser, or
        // permission was never granted — the in-app banner above already
        // covers it either way, so this is not a failure worth surfacing.
      }
    },
    [locale],
  )

  // Reacts to the price Sxr8Chart already fetched for its own display — free,
  // no extra network call, and the most common way this actually fires.
  useEffect(() => {
    if (alert && price != null && isTriggered(alert, price)) fire(price)
  }, [alert, price, fire])

  // Safety net for a visitor who leaves the app open without touching the
  // chart again: poll the cheapest range on an independent timer.
  useEffect(() => {
    if (!alert) return
    const check = async () => {
      try {
        const response = await fetch(apiUrl('/api/sxr8?range=1d'))
        if (!response.ok) return
        const payload = await response.json()
        const latest = payload?.points?.[payload.points.length - 1]?.c
        if (latest != null && isTriggered(alert, latest)) fire(latest)
      } catch {
        // Best-effort background poll; the next interval tries again.
      }
    }
    const id = setInterval(check, POLL_MS)
    return () => clearInterval(id)
  }, [alert, fire])

  const openForm = () => {
    hapticLight()
    setInputText(price != null ? String(Math.round(price)) : '')
    setFormOpen(true)
  }

  const confirmAlert = () => {
    const parsed = Number.parseFloat(inputText.replace(',', '.'))
    if (!Number.isFinite(parsed) || parsed <= 0 || price == null) return
    const next = armAlert(parsed, price)
    writeAlert(next)
    setAlert(next)
    setFormOpen(false)
    hapticSuccess()
    // Tied to this explicit action so the system permission prompt (if it
    // appears at all) has an obvious cause — never fired later, unprompted,
    // at trigger time.
    LocalNotifications.checkPermissions()
      .then((status) => (status.display === 'granted' ? status : LocalNotifications.requestPermissions()))
      .catch(() => {})
  }

  const removeAlert = () => {
    writeAlert(null)
    setAlert(null)
    hapticLight()
  }

  if (triggered) {
    return (
      <div className="price-alert-banner" role="status">
        <span>{t(locale, 'priceAlertTriggeredBanner', { price: formatEur(triggered.price, locale) })}</span>
        <button type="button" className="price-alert-dismiss" onClick={() => setTriggered(null)}>
          {t(locale, 'priceAlertDismiss')}
        </button>
      </div>
    )
  }

  if (alert) {
    return (
      <div className="price-alert-armed">
        <Bell />
        <span>
          {t(locale, alert.direction === 'above' ? 'priceAlertArmedAbove' : 'priceAlertArmedBelow', {
            price: formatEur(alert.price, locale),
          })}
        </span>
        <button
          type="button"
          className="price-alert-remove"
          onClick={removeAlert}
          aria-label={t(locale, 'priceAlertRemoveAriaLabel')}
        >
          ×
        </button>
      </div>
    )
  }

  if (formOpen) {
    return (
      <div className="price-alert-form">
        <label className="field-label" htmlFor="price-alert-input">
          {t(locale, 'priceAlertFieldLabel')}
        </label>
        <div className="price-alert-form-row">
          <input
            id="price-alert-input"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            className="amount num"
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            autoFocus
          />
          <button type="button" className="price-alert-btn" onClick={confirmAlert}>
            {t(locale, 'priceAlertConfirm')}
          </button>
          <button
            type="button"
            className="price-alert-btn price-alert-btn--ghost"
            onClick={() => setFormOpen(false)}
          >
            {t(locale, 'priceAlertCancel')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <button type="button" className="price-alert-cta" onClick={openForm} disabled={price == null}>
      <Bell />
      {t(locale, 'priceAlertCta')}
    </button>
  )
}
