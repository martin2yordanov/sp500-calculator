/**
 * Files under `api/_lib` are helpers, not routes: Vercel skips anything whose
 * path segment starts with an underscore.
 */

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

/**
 * The iOS build is served from `https://localhost` by WKWebView, so every call
 * it makes to these functions is cross-origin and needs CORS. Set
 * ALLOWED_ORIGINS if the app is ever embedded somewhere else as well.
 */
const NATIVE_ORIGINS = ['https://localhost', 'capacitor://localhost', 'ionic://localhost']

const ALLOWED = new Set([
  ...NATIVE_ORIGINS,
  ...String(process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean),
])

/**
 * Returns true when the request was a preflight and has already been answered,
 * in which case the handler must stop.
 */
export function applyCors(req, res, methods = 'GET, OPTIONS') {
  const { origin } = req.headers

  if (origin && ALLOWED.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    res.setHeader('Access-Control-Allow-Methods', `${methods}, OPTIONS`)
    res.setHeader('Access-Control-Max-Age', '86400')
  }

  // Set unconditionally: a cached response that was built for one origin must
  // not be replayed to another.
  res.setHeader('Vary', 'Origin')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }

  return false
}

export function sendError(res, cause) {
  const status = cause instanceof HttpError ? cause.status : 500
  res.status(status).json({
    error: status === 500 ? 'Неочаквана грешка на сървъра.' : cause.message,
  })
}
