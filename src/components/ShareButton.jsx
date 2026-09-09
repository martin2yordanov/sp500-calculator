import { useCallback, useState } from 'react'
import { hapticSuccess, hapticWarning } from '../lib/haptics'
import { t } from '../lib/i18n'
import { renderShareCard, shareOrDownload } from '../lib/shareCard'

// Reads the live theme tokens rather than duplicating their hex values a
// third time (styles.css and CHART in lib/theme.js are the other two) —
// canvas can't resolve var(--x) itself, but the computed style it resolves
// to is just a string, and reading it fresh here means light/dark always
// matches whatever the page is showing at the moment of the click.
const readToken = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

export default function ShareButton({ locale, palette, cardData }) {
  const [state, setState] = useState('idle') // idle | busy | failed

  const handleClick = useCallback(async () => {
    setState('busy')
    try {
      const blob = await renderShareCard({
        ...cardData,
        locale,
        palette,
        bg: readToken('--bg'),
        surface: readToken('--surface'),
        text: readToken('--text'),
        dim: readToken('--dim'),
      })
      await shareOrDownload(blob, 'sp500-calculator.png')
      setState('idle')
      hapticSuccess()
    } catch {
      // Canvas or share/download can fail for reasons outside the app's
      // control (a locked-down WebView, an out-of-memory tab); the button
      // should say so rather than pretend nothing happened.
      setState('failed')
      hapticWarning()
      setTimeout(() => setState('idle'), 3000)
    }
  }, [cardData, locale, palette])

  return (
    <div className="share-row">
      <button
        type="button"
        className="share-btn"
        onClick={handleClick}
        disabled={state === 'busy'}
      >
        {t(locale, 'shareButton')}
      </button>
      {state === 'failed' && <span className="share-error">{t(locale, 'shareFailed')}</span>}
    </div>
  )
}
