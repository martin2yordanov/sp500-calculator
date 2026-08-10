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
import {
  formatEur,
  formatPct,
  formatQuoteTimestamp,
  formatSignedEur,
} from '../lib/format'

const UP = '#5ee3b9'
const DOWN = '#f87171'

export const RANGES = [
  { key: '1d', label: '1D', long: 'Последен ден' },
  { key: '5d', label: '1W', long: 'Последна седмица' },
  { key: '1mo', label: '1M', long: 'Последен месец' },
  { key: '6mo', label: '6M', long: 'Последни 6 месеца' },
  { key: '1y', label: '1Y', long: 'Последна година' },
  { key: '5y', label: '5Y', long: 'Последни 5 години' },
  { key: 'max', label: 'Max', long: 'От началото' },
]

function ChartNote({ children }) {
  return (
    <div className="chart-note" role="status" aria-live="polite">
      {children}
    </div>
  )
}

export default function Sxr8Chart() {
  const [range, setRange] = useState('5y')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
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

    fetch(`/api/sxr8?range=${range}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      })
      .then((payload) => {
        cache.current.set(range, payload)
        setData(payload)
        setLoading(false)
      })
      .catch((cause) => {
        if (cause.name === 'AbortError') return
        setError(String(cause.message || cause))
        setLoading(false)
      })

    return () => controller.abort()
  }, [range, attempt])

  const retry = useCallback(() => {
    cache.current.delete(range)
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
  const lineColor = isUp ? UP : DOWN

  // The reference labels sit outside the plot on the right, so the gutter has
  // to be reserved — but 64px of a phone-width chart is too much to give away.
  const rightGutter = isNarrow ? 46 : 64
  const labelSize = isNarrow ? 10 : 11

  return (
    <section className="quote" aria-label="Цена на SXR8">
      <div className="card-label">SXR8 · iShares Core S&amp;P 500</div>

      <div className="quote-price num">{formatEur(end)}</div>

      {end != null && (
        <div className="quote-delta">
          <span className="quote-delta-value num" style={{ color: lineColor }}>
            {formatSignedEur(change)} {isUp ? '▲' : '▼'} {formatPct(changePct)}
          </span>
          <span className="quote-delta-range">· {activeRange.long}</span>
        </div>
      )}

      <div className="quote-chart">
        {loading ? (
          <ChartNote>Зареждане…</ChartNote>
        ) : error ? (
          <ChartNote>
            <span className="chart-note-stack">
              Грешка при зареждане на данните
              <button type="button" className="retry" onClick={retry}>
                Опитай отново
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
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
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
                  background: '#0d0d0d',
                  border: '1px solid #333',
                  borderRadius: 6,
                  fontFamily: "'Times New Roman', serif",
                  fontSize: 12,
                }}
                labelStyle={{ color: '#888' }}
                itemStyle={{ color: lineColor }}
                labelFormatter={(value) => formatQuoteTimestamp(value, range)}
                formatter={(value) => [formatEur(value), 'SXR8']}
              />

              <ReferenceLine
                y={min}
                stroke="#2a2a2a"
                strokeDasharray="2 4"
                label={{
                  value: formatEur(min).replace(' €', ''),
                  position: 'right',
                  fill: '#777',
                  fontSize: labelSize,
                  fontFamily: "'Times New Roman', serif",
                }}
              />
              <ReferenceLine
                y={max}
                stroke="transparent"
                label={{
                  value: formatEur(max).replace(' €', ''),
                  position: 'right',
                  fill: '#bbb',
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
                filter="url(#sxr8Glow)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ChartNote>Няма налични данни</ChartNote>
        )}
      </div>

      <div className="range-tabs" role="group" aria-label="Времеви обхват">
        {RANGES.map((entry) => (
          <button
            key={entry.key}
            type="button"
            className="range-tab"
            aria-pressed={range === entry.key}
            aria-label={`${entry.label} — ${entry.long}`}
            onClick={() => setRange(entry.key)}
          >
            {entry.label}
          </button>
        ))}
      </div>
    </section>
  )
}
