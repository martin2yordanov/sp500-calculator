/**
 * The app mark, as SVG source strings.
 *
 * It is generated rather than drawn once and committed as a PNG because iOS
 * alone wants the icon at a dozen sizes and the splash at three; keeping the
 * vector as the single source means a change to the curve does not have to be
 * re-cut by hand.
 */

const BG = '#080808'
const ACCENT = '#e8ff5a'

/** The compounding curve: flat for years, then steep. The whole app in one line. */
const CURVE = 'M140,846 C 432,838 648,712 884,206'

export function iconSvg(size = 1024) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#101010"/>
      <stop offset="100%" stop-color="${BG}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.82" cy="0.22" r="0.55">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <!-- A glow behind the curve's head instead of an area fill: the fill's
       vertical closing edge reads as a rendering fault at 40px. -->
  <rect width="1024" height="1024" fill="url(#glow)"/>
  <path d="${CURVE}" fill="none" stroke="${ACCENT}" stroke-width="46" stroke-linecap="round"/>
  <circle cx="884" cy="206" r="54" fill="${ACCENT}"/>
</svg>`
}

/** Icon artwork with no background, for Android's adaptive mask. */
export function iconForegroundSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <g transform="translate(512 512) scale(0.62) translate(-512 -512)">
    <path d="${CURVE}" fill="none" stroke="${ACCENT}" stroke-width="58" stroke-linecap="round"/>
    <circle cx="884" cy="206" r="64" fill="${ACCENT}"/>
  </g>
</svg>`
}

export function backgroundSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="${BG}"/>
</svg>`
}

/**
 * The maskable PWA variant. Android may crop the icon to a circle, so the mark
 * is pulled inside the 80% safe zone — at full bleed the curve's two ends sit
 * in exactly the corners a circular mask removes.
 */
export function maskableSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="${BG}"/>
  <g transform="translate(512 512) scale(0.62) translate(-512 -512)">
    <path d="${CURVE}" fill="none" stroke="${ACCENT}" stroke-width="58" stroke-linecap="round"/>
    <circle cx="884" cy="206" r="64" fill="${ACCENT}"/>
  </g>
</svg>`
}

/**
 * Square, because iOS crops the launch image to whatever the device is and a
 * 2732 square covers every one of them in both orientations. The mark sits
 * small and centred so no crop can clip it.
 */
export function splashSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732">
  <rect width="2732" height="2732" fill="${BG}"/>
  <g transform="translate(1366 1366) scale(0.44) translate(-512 -512)">
    <path d="${CURVE}" fill="none" stroke="${ACCENT}" stroke-width="54" stroke-linecap="round"/>
    <circle cx="884" cy="206" r="60" fill="${ACCENT}"/>
  </g>
</svg>`
}

export { ACCENT, BG }
