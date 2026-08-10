import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Sxr8Chart from './components/Sxr8Chart'
import { useMediaQuery } from './hooks/useMediaQuery'
import { averageMonthlyGain, buildProjection } from './lib/compound'
import { formatAxisMoney, formatCompactEur } from './lib/format'
import { BOUNDS, loadSettings, parseAmount, saveSettings } from './lib/settings'

const ACCENT = '#e8ff5a'
const INVESTED = '#3b82f6'

function ProjectionTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="tip">
      <div className="tip-label">Година {label}</div>
      {payload.map((entry) => (
        <div key={entry.name} className="tip-row" style={{ color: entry.color }}>
          {entry.name}: {formatCompactEur(entry.value)}
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const initialSettings = useMemo(loadSettings, [])

  const [years, setYears] = useState(initialSettings.years)
  const [rate, setRate] = useState(initialSettings.rate)
  // Amount fields keep their raw text so they can be cleared mid-edit.
  const [monthlyText, setMonthlyText] = useState(String(initialSettings.monthly))
  const [initialText, setInitialText] = useState(String(initialSettings.initial))
  const [profitYear, setProfitYear] = useState(initialSettings.years)
  const [saved, setSaved] = useState(false)

  const isNarrow = useMediaQuery('(max-width: 30em)')

  const monthly = parseAmount(monthlyText, 'monthly')
  const initial = parseAmount(initialText, 'initial')

  const settings = useMemo(
    () => ({ years, monthly, initial, rate }),
    [years, monthly, initial, rate],
  )

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  // Shortening the horizon used to leave `profitYear` stranded past the end of
  // the projection: the readout clamped it for display but the state kept the
  // stale value, so widening the horizon again made the year jump.
  useEffect(() => {
    setProfitYear((current) => Math.min(current, years))
  }, [years])

  const rows = useMemo(
    () => buildProjection({ years, monthly, initial, rate }),
    [years, monthly, initial, rate],
  )

  const last = rows[rows.length - 1]
  const totalInvested = last.invested
  const finalValue = last.total
  const gainPct = totalInvested > 0
    ? Math.round(((finalValue - totalInvested) / totalInvested) * 100)
    : 0
  const monthlyGain = averageMonthlyGain(rows, profitYear)

  const handleSave = useCallback(async () => {
    const params = new URLSearchParams({
      y: String(years),
      m: String(monthly),
      i: String(initial),
      r: String(rate),
    })
    window.history.replaceState({}, '', `?${params}`)
    saveSettings({ years, monthly, initial, rate })
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch {
      // Clipboard is blocked without a secure context or permission; the URL is
      // still updated, so the link remains shareable by hand.
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [years, monthly, initial, rate])

  return (
    <div className="shell">
      <div className="container">
        <header>
          <div className="eyebrow">Калкулатор за индексен фонд</div>
          <h1 className="title">
            S&amp;P 500 <span className="title-accent">Лихва върху лихва</span>
          </h1>
          <p className="lede">
            Историческа средна доходност ~10.5% / година (номинална)
          </p>
        </header>

        <Sxr8Chart />

        <div className="stats">
          <div className="stat">
            <div className="card-label">Крайна стойност</div>
            <div className="stat-value stat-value--accent num">
              {formatCompactEur(finalValue)}
            </div>
          </div>
          <div className="stat">
            <div className="card-label">Общо вложено</div>
            <div className="stat-value num">{formatCompactEur(totalInvested)}</div>
          </div>
          <div className="stat">
            <div className="card-label">Печалба</div>
            <div className="stat-value stat-value--gain num">
              {formatCompactEur(last.gains)}
              <span className="stat-pct">
                {gainPct >= 0 ? '+' : ''}
                {gainPct}%
              </span>
            </div>
          </div>
        </div>

        <section className="panel projection" aria-label="Прогноза по години">
          {/* The two areas were previously distinguishable only by hovering,
              which is a poor deal on a touch screen. */}
          <div className="legend">
            <span className="legend-item">
              <span className="legend-swatch" style={{ background: ACCENT }} />
              Портфолио
            </span>
            <span className="legend-item">
              <span className="legend-swatch" style={{ background: INVESTED }} />
              Вложено
            </span>
          </div>
          <div className="projection-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ACCENT} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={INVESTED} stopOpacity={0.1} />
                    <stop offset="95%" stopColor={INVESTED} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="year"
                  tick={{ fill: '#666', fontSize: 10, fontFamily: 'Times New Roman' }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={isNarrow ? 18 : 8}
                />
                <YAxis
                  tickFormatter={formatAxisMoney}
                  tick={{ fill: '#666', fontSize: 10, fontFamily: 'Times New Roman' }}
                  tickLine={false}
                  axisLine={false}
                  width={isNarrow ? 38 : 52}
                />
                <Tooltip content={<ProjectionTooltip />} />
                <Area
                  type="monotone"
                  dataKey="invested"
                  name="Вложено"
                  stroke={INVESTED}
                  strokeWidth={1.5}
                  fill="url(#investedGrad)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Портфолио"
                  stroke={ACCENT}
                  strokeWidth={2}
                  fill="url(#totalGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="controls">
          <div className="control--full">
            <div className="control-head">
              <label className="control-name" htmlFor="years">
                Години
              </label>
              <span className="control-value num">{years} г.</span>
            </div>
            <input
              id="years"
              type="range"
              min={BOUNDS.years.min}
              max={BOUNDS.years.max}
              step={BOUNDS.years.step}
              value={years}
              onChange={(event) => setYears(Number(event.target.value))}
            />
            <div className="scale">
              <span>{BOUNDS.years.min}</span>
              <span>{BOUNDS.years.max}</span>
            </div>
          </div>

          <div className="control--full">
            <div className="control-head">
              <label className="control-name" htmlFor="rate">
                Годишна доходност
              </label>
              <span className="control-value num">{rate}%</span>
            </div>
            <input
              id="rate"
              type="range"
              min={BOUNDS.rate.min}
              max={BOUNDS.rate.max}
              step={BOUNDS.rate.step}
              value={rate}
              onChange={(event) => setRate(Number(event.target.value))}
            />
            <div className="scale">
              <span>{BOUNDS.rate.min}%</span>
              <span className="scale-mid">S&amp;P ср. ~10.5%</span>
              <span>{BOUNDS.rate.max}%</span>
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="monthly">
              Месечно (€)
            </label>
            <input
              id="monthly"
              className="amount num"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={monthlyText}
              onChange={(event) => setMonthlyText(event.target.value)}
              onBlur={() => setMonthlyText(String(monthly))}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="initial">
              Начална сума (€)
            </label>
            <input
              id="initial"
              className="amount num"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={initialText}
              onChange={(event) => setInitialText(event.target.value)}
              onBlur={() => setInitialText(String(initial))}
            />
          </div>
        </div>

        <div className="save-row">
          <button
            type="button"
            className={`save-btn${saved ? ' saved' : ''}`}
            onClick={handleSave}
          >
            {saved ? '✓ Запазено' : 'Запази'}
          </button>
          <span className="save-hint" role="status" aria-live="polite">
            {saved ? 'Линкът е копиран — отвори го от всеки браузър' : ''}
          </span>
        </div>

        <section className="panel income" aria-label="Средна месечна печалба">
          <div className="income-head">
            <div>
              <div className="card-label">Средна месечна печалба</div>
              <div className="income-value num">{formatCompactEur(monthlyGain)}</div>
            </div>
            <div className="income-for">
              за година {profitYear === 0 ? '0 (начален момент)' : profitYear}
            </div>
          </div>

          <div>
            <div className="control-head">
              <label className="control-name" htmlFor="profit-year">
                Година
              </label>
              <span className="control-value num">{profitYear} г.</span>
            </div>
            <input
              id="profit-year"
              type="range"
              min={0}
              max={years}
              value={profitYear}
              onChange={(event) => setProfitYear(Number(event.target.value))}
            />
            <div className="scale">
              <span>0</span>
              <span>{years}</span>
            </div>
          </div>
        </section>

        <p className="disclaimer">
          Миналите резултати не гарантират бъдещи. Историческа номинална доходност
          на S&amp;P 500 ~10.5%/год. Реална (след инфлация) ~7%.
        </p>
      </div>
    </div>
  )
}
