const STORAGE_KEY = 'sp500-settings'

export const BOUNDS = {
  years: { min: 1, max: 50, step: 1 },
  rate: { min: 1, max: 20, step: 0.5 },
  monthly: { min: 0, max: 1_000_000 },
  initial: { min: 0, max: 10_000_000 },
}

export const DEFAULTS = { years: 20, monthly: 200, initial: 1000, rate: 10.5 }

const clamp = (value, { min, max }) => Math.min(max, Math.max(min, value))

/**
 * Coerce anything (URL string, stored JSON, keystroke) into a usable number.
 * Falls back to the default when the input is not finite, which is what kept
 * a hand-edited link like `?y=abc` from turning the sliders into NaN.
 */
const sanitize = (raw, key) => {
  const parsed = typeof raw === 'number' ? raw : Number.parseFloat(raw)
  if (!Number.isFinite(parsed)) return DEFAULTS[key]
  const bounded = clamp(parsed, BOUNDS[key])
  return key === 'years' ? Math.round(bounded) : bounded
}

const readStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    // Private-mode Safari and disabled storage both land here.
    return {}
  }
}

export const saveSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Persistence is a convenience; a blocked write must not break the app.
  }
}

/** URL params win over stored settings, which win over defaults. */
export const loadSettings = () => {
  const params = new URLSearchParams(window.location.search)
  const stored = readStored()

  const pick = (param, key) => {
    if (params.has(param)) return sanitize(params.get(param), key)
    if (stored[key] != null) return sanitize(stored[key], key)
    return DEFAULTS[key]
  }

  return {
    years: pick('y', 'years'),
    monthly: pick('m', 'monthly'),
    initial: pick('i', 'initial'),
    rate: pick('r', 'rate'),
  }
}

export const clampSetting = (value, key) => sanitize(value, key)

/**
 * Parses what is currently typed in an amount field. An empty field counts as
 * zero rather than snapping back to a default, so the field can be cleared and
 * retyped — the old inputs coerced every keystroke through `Math.max(0, +value)`
 * and so refused to go empty. A decimal comma is accepted because that is what
 * a Bulgarian keyboard offers.
 */
export const parseAmount = (text, key) => {
  const trimmed = String(text).trim()
  if (trimmed === '') return 0
  const parsed = Number.parseFloat(trimmed.replace(',', '.'))
  if (!Number.isFinite(parsed)) return 0
  return clamp(parsed, BOUNDS[key])
}
