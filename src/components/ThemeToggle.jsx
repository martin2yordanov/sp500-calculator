import { hapticLight } from '../lib/haptics'
import { t } from '../lib/i18n'

/**
 * Sun and moon as inline paths rather than an icon font or emoji: the page
 * already avoids depending on a font resolving, and an emoji would render in a
 * different style on every platform.
 */
const Sun = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="4.6" fill="currentColor" />
    <g stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
      <path d="M12 1.8v2.6M12 19.6v2.6M1.8 12h2.6M19.6 12h2.6" />
      <path d="M4.8 4.8l1.9 1.9M17.3 17.3l1.9 1.9M19.2 4.8l-1.9 1.9M6.7 17.3l-1.9 1.9" />
    </g>
  </svg>
)

const Moon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
    <path
      d="M20.3 14.6A8.6 8.6 0 1 1 9.4 3.7a7 7 0 0 0 10.9 10.9z"
      fill="currentColor"
    />
  </svg>
)

export default function ThemeToggle({ theme, onToggle, locale }) {
  const goingLight = theme === 'dark'
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => {
        onToggle()
        hapticLight()
      }}
      // The button switches rather than reporting state, so the name says what
      // pressing it does. aria-pressed would be ambiguous here.
      aria-label={t(locale, goingLight ? 'themeToLight' : 'themeToDark')}
      title={t(locale, goingLight ? 'themeLightTitle' : 'themeDarkTitle')}
    >
      {goingLight ? <Sun /> : <Moon />}
    </button>
  )
}
