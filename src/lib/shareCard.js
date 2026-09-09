import { formatCompactEur } from './format'
import { t } from './i18n'

const WIDTH = 1080
const HEIGHT = 1080

// Mirrors --serif / --display from styles.css. A <canvas> 2D context has no
// notion of `var(--token)` — there is no CSS cascade to resolve it against —
// so the two stacks are copied here rather than referenced.
const SERIF = '"Times New Roman", "Tinos", "Liberation Serif", Times, serif'
const DISPLAY = '"Syne", ui-sans-serif, system-ui, sans-serif'

/**
 * Draws a square summary card — final value, invested, gains, the horizon
 * that produced them — and returns it as a PNG Blob. Canvas rather than an
 * html-to-image library: the card is simple geometry and text, which canvas
 * draws directly with no extra dependency and no risk of a library's DOM
 * snapshot missing a font or a CSS custom property.
 *
 * Colours are passed in explicitly (not read from CSS) for the same reason
 * Sxr8Chart's Recharts colours are: a <canvas> 2D context has no notion of
 * `var(--token)` at all, so there is nothing to resolve here even in
 * principle.
 */
export async function renderShareCard({ finalValue, totalInvested, gains, gainPct, years, rate, locale, palette, bg, surface, text, dim }) {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = bg
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  ctx.fillStyle = surface
  const cardX = 64, cardY = 240, cardW = WIDTH - 128, cardH = 600
  roundRect(ctx, cardX, cardY, cardW, cardH, 28)
  ctx.fill()

  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'

  // Wordmark, set in the same display face as the on-page <h1> — Syne is
  // already loaded and painted by the time this can run (it renders the
  // page's own title on first paint), so there is no font-loading race to
  // guard against here.
  ctx.fillStyle = dim
  ctx.font = `800 32px ${DISPLAY}`
  ctx.fillText('S&P 500', 64, 110)

  ctx.fillStyle = text
  ctx.font = `800 64px ${SERIF}`
  ctx.fillText(t(locale, 'statFinalValue'), 64, 190)

  // Final value, the headline number
  ctx.fillStyle = palette.accent
  ctx.font = `800 108px ${SERIF}`
  ctx.fillText(formatCompactEur(finalValue, locale), cardX + 40, cardY + 140)

  // Invested / Gains, side by side
  const colY = cardY + 260
  ctx.fillStyle = dim
  ctx.font = `400 30px ${SERIF}`
  ctx.fillText(t(locale, 'statTotalInvested'), cardX + 40, colY)
  ctx.fillText(t(locale, 'statGains'), cardX + 40, colY + 160)

  ctx.fillStyle = text
  ctx.font = `700 56px ${SERIF}`
  ctx.fillText(formatCompactEur(totalInvested, locale), cardX + 40, colY + 55)

  ctx.fillStyle = palette.gain
  ctx.fillText(formatCompactEur(gains, locale), cardX + 40, colY + 215)
  ctx.font = `400 34px ${SERIF}`
  const gainsWidth = ctx.measureText(formatCompactEur(gains, locale)).width
  ctx.fillText(`${gainPct >= 0 ? '+' : ''}${gainPct}%`, cardX + 40 + gainsWidth + 60, colY + 215)

  // Horizon caption
  ctx.fillStyle = dim
  ctx.font = `400 30px ${SERIF}`
  ctx.fillText(t(locale, 'shareCardHorizon', { years, rate }), cardX + 40, cardY + cardH - 40)

  // Footer attribution — where the number came from, for anyone the image
  // reaches who was not the person who made it.
  ctx.fillStyle = dim
  ctx.font = `400 26px ${SERIF}`
  ctx.textAlign = 'center'
  ctx.fillText(t(locale, 'shareCardCaption'), WIDTH / 2, HEIGHT - 72)

  return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/**
 * Shares the blob through the OS share sheet when available (this is what
 * @capacitor/share's own web fallback uses too, so this already behaves
 * correctly inside the native app, not only the browser); otherwise falls
 * back to triggering a plain download, which every browser supports.
 */
export async function shareOrDownload(blob, filename) {
  const file = new File([blob], filename, { type: 'image/png' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch (cause) {
      // AbortError means the visitor dismissed the share sheet themselves —
      // that is not a failure worth falling back for.
      if (cause?.name === 'AbortError') return 'cancelled'
    }
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  return 'downloaded'
}
