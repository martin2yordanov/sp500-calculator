import { t } from '../lib/i18n'

/**
 * Text rather than a flag icon: English is not one country's language, and a
 * flag would misrepresent the Bulgarian-speaking diaspora this toggle is
 * partly for. The visible label is always the *other* language's own name
 * for itself ("English" while reading Bulgarian, "БГ" while reading English)
 * — a language switch showing the current language's name is the classic
 * pattern users click on by mistake, since it reads as a label, not a control.
 */
export default function LocaleToggle({ locale, onToggle }) {
  return (
    <button
      type="button"
      className="locale-toggle"
      onClick={onToggle}
      aria-label={t(locale, 'localeToggleAriaLabel')}
      title={t(locale, 'localeToggleTitle')}
    >
      {t(locale, 'localeToggleTitle')}
    </button>
  )
}
