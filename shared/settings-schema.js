/**
 * The single description of what a settings payload may contain.
 *
 * It lives outside `src/` because both sides of the wire need it: the browser
 * clamps with it before saving, and `api/settings.js` clamps with it again
 * before anything is persisted. A request that skips the app entirely must not
 * be able to store a 10^9-year horizon that later breaks the projection.
 */

export const BOUNDS = {
  years: { min: 1, max: 50, step: 1 },
  rate: { min: 1, max: 20, step: 0.5 },
  monthly: { min: 0, max: 1_000_000 },
  initial: { min: 0, max: 10_000_000 },
  growth: { min: 0, max: 1000, step: 50 },
  target: { min: 0, max: 100_000_000 },
}

export const DEFAULTS = {
  years: 20,
  monthly: 200,
  initial: 1000,
  rate: 10.5,
  growth: 0,
  target: 100_000,
}

export const SETTING_KEYS = Object.keys(DEFAULTS)

/** URL param name per setting, kept short because the link is meant to be shared. */
export const PARAM_OF = {
  years: 'y',
  monthly: 'm',
  initial: 'i',
  rate: 'r',
  growth: 'g',
  target: 't',
}

const clamp = (value, { min, max }) => Math.min(max, Math.max(min, value))

/**
 * Coerce anything (URL string, stored JSON, request body, keystroke) into a
 * usable number. Falls back to the default when the input is not finite, which
 * is what kept a hand-edited link like `?y=abc` from turning the sliders into
 * NaN.
 */
export const sanitizeSetting = (raw, key) => {
  const parsed = typeof raw === 'number' ? raw : Number.parseFloat(raw)
  if (!Number.isFinite(parsed)) return DEFAULTS[key]
  const bounded = clamp(parsed, BOUNDS[key])
  return key === 'years' ? Math.round(bounded) : bounded
}

/** Always returns a complete, in-bounds settings object — never a partial one. */
export const sanitizeSettings = (raw) => {
  const source = raw && typeof raw === 'object' ? raw : {}
  return Object.fromEntries(
    SETTING_KEYS.map((key) => [key, sanitizeSetting(source[key], key)]),
  )
}

/**
 * Used to decide whether a cloud write is worth making. Sliders fire a change
 * per pixel of travel, and without this the app would PUT on every one of them.
 */
export const settingsEqual = (a, b) =>
  Boolean(a) && Boolean(b) && SETTING_KEYS.every((key) => a[key] === b[key])
