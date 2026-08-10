/**
 * Proxies Yahoo Finance for SXR8.DE (iShares Core S&P 500 UCITS ETF, Xetra).
 * The browser cannot call Yahoo directly because of CORS, so this trims the
 * upstream payload down to the `{ t, c }` points the chart actually plots.
 */

const SYMBOL = 'SXR8.DE'

// Range is the only input, and it decides both the upstream window and the
// candle size. Keeping it as a fixed table means a caller cannot smuggle
// arbitrary query state into the upstream request.
const RANGES = {
  '1d': { interval: '5m', maxAge: 60 },
  '5d': { interval: '30m', maxAge: 300 },
  '1mo': { interval: '90m', maxAge: 900 },
  '6mo': { interval: '1d', maxAge: 3600 },
  '1y': { interval: '1d', maxAge: 3600 },
  '5y': { interval: '1wk', maxAge: 21600 },
  max: { interval: '1mo', maxAge: 86400 },
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

  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${SYMBOL}` +
    `?range=${requested}&interval=${config.interval}`

  try {
    const upstream = await fetch(url, {
      headers: {
        // Yahoo throttles requests that arrive without a browser-ish UA.
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!upstream.ok) {
      res.status(502).json({ error: `Yahoo отговори с ${upstream.status}` })
      return
    }

    const body = await upstream.json()
    const result = body?.chart?.result?.[0]

    if (!result) {
      const message = body?.chart?.error?.description ?? 'Липсват данни'
      res.status(502).json({ error: message })
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

    const latest = result.meta?.regularMarketPrice
    if (
      typeof latest === 'number' &&
      Number.isFinite(latest) &&
      points.length &&
      points[points.length - 1].c !== latest
    ) {
      // Keeps the tail of the line on the live price instead of the last
      // completed candle.
      points.push({ t: Date.now(), c: latest })
    }

    res.setHeader(
      'Cache-Control',
      `public, s-maxage=${config.maxAge}, stale-while-revalidate=${config.maxAge * 4}`,
    )
    res.status(200).json({
      currency: result.meta?.currency ?? 'EUR',
      currentPrice: latest ?? points[points.length - 1]?.c ?? null,
      points,
    })
  } catch (cause) {
    const timedOut = cause?.name === 'TimeoutError' || cause?.name === 'AbortError'
    res.status(timedOut ? 504 : 500).json({
      error: timedOut ? 'Изтече времето за отговор' : 'Неуспешна заявка към Yahoo',
    })
  }
}
