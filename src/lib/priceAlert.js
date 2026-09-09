const STORAGE_KEY = 'sp500-price-alert'

export const readAlert = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    const valid =
      parsed &&
      Number.isFinite(parsed.price) &&
      (parsed.direction === 'above' || parsed.direction === 'below')
    return valid ? parsed : null
  } catch {
    // Private-mode Safari and disabled storage both land here.
    return null
  }
}

export const writeAlert = (alert) => {
  try {
    if (alert) localStorage.setItem(STORAGE_KEY, JSON.stringify(alert))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Persistence is a convenience; a blocked write must not break the toggle.
  }
}

/**
 * Direction is decided once, at the moment the alert is armed, rather than
 * re-derived from "current vs. target" on every later check — by the next
 * check the live price has already moved, so re-deriving it there could flip
 * the meaning of an alert the visitor already set.
 */
export const armAlert = (targetPrice, currentPrice) => ({
  price: targetPrice,
  direction: targetPrice >= currentPrice ? 'above' : 'below',
})

export const isTriggered = (alert, currentPrice) =>
  alert.direction === 'above' ? currentPrice >= alert.price : currentPrice <= alert.price
