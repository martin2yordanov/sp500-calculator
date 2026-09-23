import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { t } from '../lib/i18n'

/**
 * The modal shell both auth panels sit in. It slides up from the bottom
 * because that is where a thumb is, and it is rendered through a portal so the
 * page's own stacking contexts (the charts each create one) cannot clip it.
 */
export default function Sheet({ title, locale, onClose, children }) {
  const panelRef = useRef(null)

  useEffect(() => {
    const previous = document.activeElement
    panelRef.current?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    // Without this the page behind keeps scrolling under the sheet on iOS.
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [onClose])

  return createPortal(
    <div className="sheet-backdrop" onMouseDown={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={panelRef}
        // Stops a drag that starts inside the panel from counting as a
        // backdrop tap when it ends outside.
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-head">
          <h2 className="sheet-title">{title}</h2>
          <button
            type="button"
            className="sheet-close"
            onClick={onClose}
            aria-label={t(locale, 'authClose')}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
