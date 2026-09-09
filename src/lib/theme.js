const STORAGE_KEY = 'sp500-theme'

export const THEMES = ['dark', 'light']

/**
 * Chart colours per theme.
 *
 * These cannot live in styles.css with the rest of the tokens: Recharts writes
 * `stroke` and `fill` as SVG presentation attributes, and `var(--x)` is not
 * resolved there — only CSS properties resolve custom properties. So the two
 * palettes are duplicated in JS on purpose, and must be kept in step with the
 * `:root` / `[data-theme='light']` blocks by hand.
 */
export const CHART = {
  dark: {
    accent: '#e8ff5a',
    invested: '#3b82f6',
    up: '#5ee3b9',
    down: '#f87171',
    axisTick: '#666',
    tooltipBg: '#0d0d0d',
    tooltipBorder: '#333',
    tooltipLabel: '#888',
    minLine: '#2a2a2a',
    minLabel: '#777',
    maxLabel: '#bbb',
    // Opacity of the area fill under each line.
    fillOpacity: 0.15,
    investedFillOpacity: 0.1,
    quoteFillOpacity: 0.25,
    glow: true,
  },
  light: {
    // Lime at #e8ff5a is all but invisible on white, so the accent darkens to an
    // olive of the same hue for anything drawn as a line or set as text. The
    // bright lime survives only as the Save button's background, where it sits
    // under near-black text — see --accent-solid.
    accent: '#647700',
    invested: '#1d4ed8',
    up: '#0b7d5d',
    down: '#b91c1c',
    axisTick: '#6b6a60',
    tooltipBg: '#ffffff',
    tooltipBorder: '#d6d3c9',
    tooltipLabel: '#6b6a62',
    minLine: '#d6d3c9',
    minLabel: '#6b6a62',
    maxLabel: '#3a3934',
    // A tint reads much stronger against white than against near-black, so the
    // fills are pulled back to keep the lines dominant.
    fillOpacity: 0.12,
    investedFillOpacity: 0.08,
    quoteFillOpacity: 0.16,
    glow: false,
  },
}

/** Drives the `theme-color` meta so the iOS status bar matches the page. */
export const THEME_COLOR = { dark: '#080808', light: '#faf9f6' }

export const readStoredTheme = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return THEMES.includes(stored) ? stored : null
  } catch {
    // Private-mode Safari and disabled storage both land here.
    return null
  }
}

export const storeTheme = (theme) => {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Persistence is a convenience; a blocked write must not break the toggle.
  }
}

export const systemTheme = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'

/** An explicit choice wins over the OS preference. */
export const initialTheme = () => readStoredTheme() ?? systemTheme()
