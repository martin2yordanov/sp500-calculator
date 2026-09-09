import { INTL_LOCALE, t } from './i18n'

const decimals2 = { minimumFractionDigits: 2, maximumFractionDigits: 2 }

/** "724,30 €" (bg) / "724.30 €" (en) — full precision, for the live quote. */
export const formatEur = (value, locale) =>
  value == null ? '—' : `${value.toLocaleString(INTL_LOCALE[locale], decimals2)} €`

/** "+88,23%" / "−12,50%" */
export const formatPct = (value, locale) => {
  if (value == null) return '—'
  const sign = value >= 0 ? '+' : '−'
  return `${sign}${Math.abs(value).toLocaleString(INTL_LOCALE[locale], decimals2)}%`
}

/** "+339,50 €" / "−12,00 €" */
export const formatSignedEur = (value, locale) => {
  if (value == null) return '—'
  const sign = value >= 0 ? '+' : '−'
  return `${sign}${Math.abs(value).toLocaleString(INTL_LOCALE[locale], decimals2)} €`
}

/**
 * Compact money for the stat cards: "1,23M €" above a million, grouped
 * thousands below it. Uses the active locale's own decimal mark so it
 * matches every other figure on the page in that language.
 */
export const formatCompactEur = (value, locale) => {
  if (value == null || !Number.isFinite(value)) return '—'
  if (Math.abs(value) >= 1e6) {
    return `${(value / 1e6).toLocaleString(INTL_LOCALE[locale], decimals2)}M €`
  }
  return `${Math.round(value).toLocaleString(INTL_LOCALE[locale])} €`
}

/**
 * Axis ticks only. Currency symbol dropped and thousands abbreviated so the
 * Y axis needs ~40px instead of ~80px — real estate a phone does not have.
 */
export const formatAxisMoney = (value, locale) => {
  const abs = Math.abs(value)
  if (abs >= 1e6) {
    return `${(value / 1e6).toLocaleString(INTL_LOCALE[locale], { maximumFractionDigits: 1 })}M`
  }
  if (abs >= 1e3) return `${Math.round(value / 1e3)}${t(locale, 'axisThousand')}`
  return String(Math.round(value))
}

/**
 * "преди 3 мин" / "3 min ago" — for the offline stale-price banner. Coarse on
 * purpose: the point is "is this safe to trust", not a precise duration.
 */
export const formatRelativeTime = (timestamp, locale) => {
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000))
  if (seconds < 60) return t(locale, 'relativeNow')
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return t(locale, 'relativeMinutes', { n: minutes })
  const hours = Math.round(minutes / 60)
  if (hours < 24) return t(locale, 'relativeHours', { n: hours })
  const days = Math.round(hours / 24)
  return t(locale, days === 1 ? 'relativeDaysOne' : 'relativeDaysMany', { n: days })
}

/** Intraday ranges get a time, longer ones get a date. */
export const formatQuoteTimestamp = (timestamp, range, locale) => {
  const date = new Date(timestamp)
  const intl = INTL_LOCALE[locale]
  if (range === '1d' || range === '5d') {
    return date.toLocaleString(intl, {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    })
  }
  return date.toLocaleDateString(intl, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
