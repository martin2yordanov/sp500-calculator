import { hapticLight } from '../lib/haptics'
import { t } from '../lib/i18n'
import { BOUNDS, parseAmount } from '../lib/settings'

/**
 * Amount input with steppers.
 *
 * Nudging a value on a phone otherwise means summoning the keyboard, selecting
 * the old number and retyping it — three interactions to change 200 to 250. The
 * buttons make the common adjustment a single tap, while the field still takes
 * arbitrary values for anything the steps do not reach.
 */
export default function AmountField({ id, label, value, text, step, locale, onChange, onCommit }) {
  const bounds = BOUNDS[id]

  const nudge = (delta) => {
    // Snap to the step grid so repeated taps land on round numbers even when
    // the starting value was typed by hand.
    const next = delta > 0
      ? Math.floor(value / step) * step + step
      : Math.ceil(value / step) * step - step
    onChange(String(Math.min(bounds.max, Math.max(bounds.min, next))))
    hapticLight()
  }

  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="stepper">
        <button
          type="button"
          className="stepper-btn"
          onClick={() => nudge(-1)}
          disabled={value <= bounds.min}
          aria-label={t(locale, 'amountDecreaseAriaLabel', { label, step })}
        >
          −
        </button>
        <input
          id={id}
          className="amount num"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={text}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onCommit}
        />
        <button
          type="button"
          className="stepper-btn"
          onClick={() => nudge(1)}
          disabled={value >= bounds.max}
          aria-label={t(locale, 'amountIncreaseAriaLabel', { label, step })}
        >
          +
        </button>
      </div>
    </div>
  )
}

