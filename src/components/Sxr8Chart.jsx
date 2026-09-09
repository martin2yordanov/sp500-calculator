import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useMediaQuery } from '../hooks/useMediaQuery'
import PriceAlert from './PriceAlert'
import { apiUrl } from '../lib/api'
import {
  formatEur,
  formatPct,
  formatQuoteTimestamp,
  formatRelativeTime,
  formatSignedEur,
} from '../lib/format'
import { t } from '../lib/i18n'
import { readCachedPrice, writeCachedPrice } from '../lib/priceCache'

// Labels ("1D", "5Y"...) are ticker-style abbreviations, unchanged across
// locales. The long form (for the aria-label) comes from the dictionary —
// this table only says which key holds it, so a typo in a locale string
// cannot silently point a range at the wrong description.
export const RANGES = [
  { key: '1d', label: '1D', longKey: 'range1dLong' },
  { key: '5d', label: '1W', longKey: 'range5dLong' },
  { key: '1mo', label: '1M', longKey: 'range1moLong' },
  { key: '6mo', label: '6M', longKey: 'range6moLong' },
  { key: '1y', label: '1Y', longKey: 'range1yLong' },
  { key: '5y', label: '5Y', longKey: 'range5yLong' },
  { key: 'max', label: 'Max', longKey: 'rangeMaxLong' },
]

function ChartNote({ children }) {
  return (
    <div className="chart-note" role="status" aria-live="polite">
      {children}
    </div>
  )
}

export default function Sxr8Chart({ palette, locale }) {
  const [range, setRange] = useState('5y')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Set only when the current data came from the offline cache rather than a
  // live fetch, so the UI can say so instead of presenting stale data as fresh.
  const [staleSince, setStaleSince] = useState(null)
  const [attempt, setAttempt] = useState(0)

  // Ranges already fetched are kept so flipping between tabs is instant and
  // does not re-hit the API on every toggle.
  const cache = useRef(new Map())
  const isNarrow = useMediaQuery('(max-width: 30em)')

  useEffect(() => {
    const cached = cache.current.get(range)
    if (cached) {
      setData(cached)
      setError(null)
      setLoading(false)
      return
    }

    // AbortController cancels the in-flight request outright, rather than
    // letting it finish and discarding the result.
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetch(apiUrl(`/api/sxr8?range=${range}`), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      })
      .then((payload) => {
        cache.current.set(range, payload)
        writeCachedPrice(range, payload)
        setStaleSince(null)
        setData(payload)
        setLoading(false)
      })
      .catch((cause) => {
        if (cause.name === 'AbortError') return
        const cached = readCachedPrice(range)
        if (cached) {
          cache.current.set(range, cached.payload)
          setStaleSince(cached.savedAt)
          setData(cached.payload)
        } else {
          setError(String(cause.message || cause))
        }
        setLoading(false)
      })

    return () => controller.abort()
  }, [range, attempt])

  const retry = useCallback(() => {
    cache.current.delete(range)
    setStaleSince(null)
    setAttempt((n) => n + 1)
  }, [range])

  const series = useMemo(() => {
    const points = data?.points ?? []
    if (!points.length) return { points }

    const first = points[0].c
    const last = points[points.length - 1].c
    let min = Infinity
    let max = -Infinity
    points.forEach(({ c }) => {
      if (c < min) min = c
      if (c > max) max = c
    })

    const change = last - first
    return {
      points,
      end: last,
      change,
      changePct: first ? (change / first) * 100 : 0,
      min,
      max,
    }
  }, [data])

  const { points, end, change, changePct, min, max } = series
  const activeRange = RANGES.find((entry) => entry.key === range) ?? RANGES[0]
  const isUp = (change ?? 0) >= 0
  const lineColor = isUp ? palette.up : palette.down

  // The reference labels sit outside the plot on the right, so the gutter has
  // to be reserved — but 64px of a phone-width chart is too much to give away.
  const rightGutter = isNarrow ? 46 : 64
  const labelSize = isNarrow ? 10 : 11

  return (
    <section className="quote" aria-label={t(locale, 'quoteAriaLabel')}>
      <div className="card-label">SXR8 · iShares Core S&amp;P 500</div>

      <div className="quote-price num">{formatEur(end, locale)}</div>

      {end != null && (
        <div className="quote-delta">
          <span className="quote-delta-value num" style={{ color: lineColor }}>
            {formatSignedEur(change, locale)} {isUp ? '▲' : '▼'} {formatPct(changePct, locale)}
          </span>
          <span className="quote-delta-range">· {t(locale, activeRange.longKey)}</span>
        </div>
      )}

      {/*
        Shown when the fetch failed and a cached price filled in instead — see
        readCachedPrice in Sxr8Chart's effect. Without this the visitor has no
        way to tell a live price from Tuesday's, which matters for a figure
        people might act on.
      */}
      {staleSince != null && (
        <div className="quote-stale" role="status">
          {t(locale, 'quoteStale', { time: formatRelativeTime(staleSince, locale) })}
        </div>
      )}

      <div className="quote-chart">
        {loading ? (
          <ChartNote>{t(locale, 'quoteLoading')}</ChartNote>
        ) : error ? (
          <ChartNote>
            <span className="chart-note-stack">
              {t(locale, 'quoteError')}
              <button type="button" className="retry" onClick={retry}>
                {t(locale, 'quoteRetry')}
              </button>
            </span>
          </ChartNote>
        ) : points?.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={points}
              margin={{ top: 14, right: rightGutter, left: 4, bottom: 4 }}
            >
              <defs>
                <linearGradient id="sxr8Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={palette.quoteFillOpacity} />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
                <filter id="sxr8Glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <XAxis dataKey="t" hide />
              <YAxis domain={[(low) => low * 0.98, (high) => high * 1.02]} hide />

              <Tooltip
                contentStyle={{
                  background: palette.tooltipBg,
                  border: `1px solid ${palette.tooltipBorder}`,
                  borderRadius: 6,
                  fontFamily: "'Times New Roman', serif",
                  fontSize: 12,
                }}
                labelStyle={{ color: palette.tooltipLabel }}
                itemStyle={{ color: lineColor }}
                labelFormatter={(value) => formatQuoteTimestamp(value, range, locale)}
                formatter={(value) => [formatEur(value, locale), 'SXR8']}
              />

              <ReferenceLine
                y={min}
                stroke={palette.minLine}
                strokeDasharray="2 4"
                label={{
                  value: formatEur(min, locale).replace(' €', ''),
                  position: 'right',
                  fill: palette.minLabel,
                  fontSize: labelSize,
                  fontFamily: "'Times New Roman', serif",
                }}
              />
              <ReferenceLine
                y={max}
                stroke="transparent"
                label={{
                  value: formatEur(max, locale).replace(' €', ''),
                  position: 'right',
                  fill: palette.maxLabel,
                  fontSize: labelSize,
                  fontFamily: "'Times New Roman', serif",
                }}
              />

              <Area
                type="monotone"
                dataKey="c"
                stroke={lineColor}
                strokeWidth={2}
                fill="url(#sxr8Grad)"
                dot={false}
                // The glow reads as a halo lifting the line off a dark card.
                // On white it just muddies the stroke, so it is dark-only.
                filter={palette.glow ? 'url(#sxr8Glow)' : undefined}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ChartNote>{t(locale, 'quoteNoData')}</ChartNote>
        )}
      </div>

      <div className="range-tabs" role="group" aria-label={t(locale, 'quoteRangeGroupAriaLabel')}>
        {RANGES.map((entry) => (
          <button
            key={entry.key}
            type="button"
            className="range-tab"
            aria-pressed={range === entry.key}
            aria-label={`${entry.label} — ${t(locale, entry.longKey)}`}
            onClick={() => setRange(entry.key)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <PriceAlert price={end} locale={locale} />
    </section>
  )
}
