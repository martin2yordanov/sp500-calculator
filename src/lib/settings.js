import {
  BOUNDS,
  DEFAULTS,
  PARAM_OF,
  SETTING_KEYS,
  sanitizeSetting,
  sanitizeSettings,
  settingsEqual,
} from '../../shared/settings-schema.js'

export { BOUNDS, DEFAULTS, SETTING_KEYS, sanitizeSettings, settingsEqual }

const STORAGE_KEY = 'sp500-settings'

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

  const pick = (key) => {
    const param = PARAM_OF[key]
    if (params.has(param)) return sanitizeSetting(params.get(param), key)
    if (stored[key] != null) return sanitizeSetting(stored[key], key)
    return DEFAULTS[key]
  }

  return Object.fromEntries(SETTING_KEYS.map((key) => [key, pick(key)]))
}

/** The shareable query string behind the Запази button. */
export const settingsToParams = (settings) =>
  new URLSearchParams(
    SETTING_KEYS.map((key) => [PARAM_OF[key], String(settings[key])]),
  )

export const clampSetting = (value, key) => sanitizeSetting(value, key)

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
  const { min, max } = BOUNDS[key]
  return Math.min(max, Math.max(min, parsed))
}
