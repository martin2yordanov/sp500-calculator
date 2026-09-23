/**
 * Inline marks rather than a webfont or a CDN image: the app ships as a signed
 * bundle and must render identically with no network, and Apple's logo
 * character (U+F8FF) only resolves on Apple platforms — on the web build
 * elsewhere it draws an empty box.
 */

export function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M16.37 1.43c0 1.14-.42 2.2-1.26 3.02-.9.88-1.99 1.4-3.03 1.32-.13-1.1.42-2.24 1.24-3.03.87-.85 2.14-1.4 3.05-1.31zM20.7 17.2c-.5 1.16-.74 1.67-1.38 2.7-.9 1.43-2.16 3.2-3.73 3.22-1.39.01-1.75-.9-3.64-.9-1.89.01-2.28.91-3.67.9-1.57-.01-2.77-1.62-3.66-3.04-2.5-3.96-2.77-8.6-1.22-11.07 1.1-1.75 2.83-2.78 4.46-2.78 1.66 0 2.7.91 4.07.91 1.33 0 2.14-.91 4.06-.91 1.45 0 2.99.79 4.09 2.16-3.6 1.97-3.02 7.1.62 8.81z" />
    </svg>
  )
}

export function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.92l-3.88-3a7.2 7.2 0 0 1-10.71-3.78h-4v3.1A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.35 14.3a7.19 7.19 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.18 15.23 0 12 0A12 12 0 0 0 1.35 6.6l4 3.1A7.2 7.2 0 0 1 12 4.77z"
      />
    </svg>
  )
}
