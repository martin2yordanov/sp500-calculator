const BG = 'bg-BG'

const decimals2 = { minimumFractionDigits: 2, maximumFractionDigits: 2 }

/** "724,30 €" — full precision, for the live quote. */
export const formatEur = (value) =>
  value == null ? '—' : `${value.toLocaleString(BG, decimals2)} €`

/** "+88,23%" / "−12,50%" */
export const formatPct = (value) => {
  if (value == null) return '—'
  const sign = value >= 0 ? '+' : '−'
  return `${sign}${Math.abs(value).toLocaleString(BG, decimals2)}%`
}

/** "+339,50 €" / "−12,00 €" */
export const formatSignedEur = (value) => {
  if (value == null) return '—'
  const sign = value >= 0 ? '+' : '−'
  return `${sign}${Math.abs(value).toLocaleString(BG, decimals2)} €`
}

/**
 * Compact money for the stat cards: "1,23M €" above a million, grouped
 * thousands below it. Uses a decimal comma so it matches every other figure
 * on the page — the original produced "1.23M €" here and "724,30 €" elsewhere.
 */
export const formatCompactEur = (value) => {
  if (value == null || !Number.isFinite(value)) return '—'
  if (Math.abs(value) >= 1e6) {
    return `${(value / 1e6).toLocaleString(BG, decimals2)}M €`
  }
  return `${Math.round(value).toLocaleString(BG)} €`
}

/**
 * Axis ticks only. Currency symbol dropped and thousands abbreviated so the
 * Y axis needs ~40px instead of ~80px — real estate a phone does not have.
 */
export const formatAxisMoney = (value) => {
  const abs = Math.abs(value)
  if (abs >= 1e6) return `${(value / 1e6).toLocaleString(BG, { maximumFractionDigits: 1 })}M`
  if (abs >= 1e3) return `${Math.round(value / 1e3)}к`
  return String(Math.round(value))
}

/**
 * "преди 3 мин" / "преди 2 ч" / "преди 5 дни" — for the offline stale-price
 * banner. Coarse on purpose: the point is "is this safe to trust", not a
 * precise duration.
 */
export const formatRelativeTime = (timestamp) => {
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000))
  if (seconds < 60) return 'току-що'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `преди ${minutes} мин`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `преди ${hours} ч`
  const days = Math.round(hours / 24)
  return `преди ${days} ${days === 1 ? 'ден' : 'дни'}`
}

/** Intraday ranges get a time, longer ones get a date. */
export const formatQuoteTimestamp = (timestamp, range) => {
  const date = new Date(timestamp)
  if (range === '1d' || range === '5d') {
    return date.toLocaleString(BG, {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    })
  }
  return date.toLocaleDateString(BG, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
