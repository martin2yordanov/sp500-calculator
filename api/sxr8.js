/**
 * Proxies Yahoo Finance for SXR8.DE (iShares Core S&P 500 UCITS ETF, Xetra).
 * The browser cannot call Yahoo directly because of CORS, so this trims the
 * upstream payload down to the `{ t, c }` points the chart actually plots.
 *
 * Yahoo rate-limits the chart endpoint per calling IP, and serverless functions
 * egress from shared cloud addresses — so a single unauthenticated call is not
 * a reliable strategy. Two things guard against that here: several upstream
 * variants are tried in order, and a success is cached at the edge long enough
 * that most visitors never cause an upstream call at all.
 */

const SYMBOL = 'SXR8.DE'

// Range is the only input, and it decides both the upstream window and the
// candle size. Keeping it as a fixed table means a caller cannot smuggle
// arbitrary query state into the upstream request.
const RANGES = {
  '1d': { interval: '5m', maxAge: 300 },
  '5d': { interval: '30m', maxAge: 900 },
  '1mo': { interval: '90m', maxAge: 1800 },
  '6mo': { interval: '1d', maxAge: 3600 },
  '1y': { interval: '1d', maxAge: 3600 },
  '5y': { interval: '1wk', maxAge: 21600 },
  max: { interval: '1mo', maxAge: 86400 },
}

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

/**
 * query1 and query2 sit behind different edges and are not always throttled
 * together, and the header shape changes how Yahoo classifies the caller.
 * Ordered cheapest-first; the first success wins.
 */
const VARIANTS = [
  { id: 'q1-bare', host: 'query1', headers: {} },
  { id: 'q2-bare', host: 'query2', headers: {} },
  { id: 'q2-browser', host: 'query2', headers: { 'User-Agent': BROWSER_UA } },
  { id: 'q1-browser', host: 'query1', headers: { 'User-Agent': BROWSER_UA } },
]

const RETRYABLE = new Set([403, 408, 425, 429, 500, 502, 503, 504])

const buildUrl = (host, range, interval) =>
  `https://${host}.finance.yahoo.com/v8/finance/chart/${SYMBOL}` +
  `?range=${range}&interval=${interval}`

/** Resolves to `{ ok: true, result }` or `{ ok: false, status, retryable }`. */
async function attempt(variant, range, interval) {
  const headers = { Accept: 'application/json', ...variant.headers }
  try {
    const response = await fetch(buildUrl(variant.host, range, interval), {
      headers,
      signal: AbortSignal.timeout(4500),
    })

    if (!response.ok) {
      return { ok: false, status: String(response.status), retryable: RETRYABLE.has(response.status) }
    }

    const body = await response.json()
    const result = body?.chart?.result?.[0]
    if (!result) {
      const description = body?.chart?.error?.description
      // A symbol-level error is not going to resolve on the next host.
      return { ok: false, status: description ? 'upstream-error' : 'empty', retryable: false }
    }

    return { ok: true, result }
  } catch (cause) {
    const timedOut = cause?.name === 'TimeoutError' || cause?.name === 'AbortError'
    return { ok: false, status: timedOut ? 'timeout' : 'network', retryable: true }
  }
}

export default async function handler(req, res) {
  const requested = String(req.query.range ?? '5y')
  const config = RANGES[requested]

  if (!config) {
    res.status(400).json({
      error: 'Невалиден обхват',
      allowed: Object.keys(RANGES),
    })
    return
  }

  const tried = []
  let result = null
  let usedVariant = null

  for (const variant of VARIANTS) {
    const outcome = await attempt(variant, requested, config.interval)
    tried.push(`${variant.id}:${outcome.ok ? 'ok' : outcome.status}`)
    if (outcome.ok) {
      result = outcome.result
      usedVariant = variant.id
      break
    }
    if (!outcome.retryable) break
  }

  if (!result) {
    // Cached briefly so a throttled upstream is not hammered once per visitor,
    // while still clearing quickly once Yahoo lets us back in.
    res.setHeader('Cache-Control', 'public, s-maxage=30')
    res.setHeader('X-Upstream-Attempts', tried.join(','))
    res.status(502).json({ error: 'Данните не са достъпни в момента', tried })
    return
  }

  const timestamps = result.timestamp ?? []
  const closes = result.indicators?.quote?.[0]?.close ?? []

  // Yahoo pads gaps (holidays, halts) with nulls; plotting those breaks the
  // area fill, so they are dropped rather than interpolated.
  const points = []
  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i]
    if (typeof close === 'number' && Number.isFinite(close)) {
      points.push({ t: timestamps[i] * 1000, c: close })
    }
  }

  if (!points.length) {
    res.setHeader('Cache-Control', 'public, s-maxage=30')
    res.status(502).json({ error: 'Няма налични точки', tried })
    return
  }

  const latest = result.meta?.regularMarketPrice
  if (
    typeof latest === 'number' &&
    Number.isFinite(latest) &&
    points[points.length - 1].c !== latest
  ) {
    // Keeps the tail of the line on the live price instead of the last
    // completed candle.
    points.push({ t: Date.now(), c: latest })
  }

  res.setHeader(
    'Cache-Control',
    `public, s-maxage=${config.maxAge}, stale-while-revalidate=${config.maxAge * 8}`,
  )
  res.setHeader('X-Upstream-Variant', usedVariant)
  res.status(200).json({
    currency: result.meta?.currency ?? 'EUR',
    currentPrice: latest ?? points[points.length - 1]?.c ?? null,
    points,
  })
}
