import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import AmountField from './components/AmountField'
import LocaleToggle from './components/LocaleToggle'
import ShareButton from './components/ShareButton'
import Sxr8Chart from './components/Sxr8Chart'
import ThemeToggle from './components/ThemeToggle'
import { useLocale } from './hooks/useLocale'
import { useMediaQuery } from './hooks/useMediaQuery'
import { useTheme } from './hooks/useTheme'
import { averageMonthlyGain, buildProjection, yearsToReach } from './lib/compound'
import { formatAxisMoney, formatCompactEur } from './lib/format'
import { hapticLight, hapticSelectionChanged, hapticSuccess } from './lib/haptics'
import { t } from './lib/i18n'
import {
  BOUNDS,
  DEFAULTS,
  loadSettings,
  parseAmount,
  saveSettings,
} from './lib/settings'
import { CHART } from './lib/theme'

function ProjectionTooltip({ active, payload, label, locale }) {
  if (!active || !payload?.length) return null
  return (
    <div className="tip">
      <div className="tip-label">{t(locale, 'tooltipYear', { n: label })}</div>
      {payload.map((entry) => (
        <div key={entry.name} className="tip-row" style={{ color: entry.color }}>
          {entry.name}: {formatCompactEur(entry.value, locale)}
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const initialSettings = useMemo(loadSettings, [])

  const [years, setYears] = useState(initialSettings.years)
  const [rate, setRate] = useState(initialSettings.rate)
  const [growth, setGrowth] = useState(initialSettings.growth)
  // Amount fields keep their raw text so they can be cleared mid-edit.
  const [monthlyText, setMonthlyText] = useState(String(initialSettings.monthly))
  const [initialText, setInitialText] = useState(String(initialSettings.initial))
  const [targetText, setTargetText] = useState(String(initialSettings.target))
  const [profitYear, setProfitYear] = useState(initialSettings.years)
  const [saved, setSaved] = useState(false)
  // Distinguishes what the "saved" checkmark actually did, so the hint text
  // underneath it never claims a clipboard copy that didn't happen.
  const [savedVia, setSavedVia] = useState(null)

  const isNarrow = useMediaQuery('(max-width: 30em)')
  const { theme, toggle } = useTheme()
  const { locale, toggle: toggleLocale } = useLocale()
  // Recharts writes these as SVG attributes, where `var(--token)` would not
  // resolve, so the chart colours come from JS rather than the stylesheet.
  const palette = CHART[theme]

  const monthly = parseAmount(monthlyText, 'monthly')
  const initial = parseAmount(initialText, 'initial')
  const target = parseAmount(targetText, 'target')

  const settings = useMemo(
    () => ({ years, monthly, initial, rate, growth, target }),
    [years, monthly, initial, rate, growth, target],
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
    () => buildProjection({ years, monthly, initial, rate, monthlyGrowthPct: growth }),
    [years, monthly, initial, rate, growth],
  )

  const last = rows[rows.length - 1]
  const totalInvested = last.invested
  const finalValue = last.total
  const gainPct = totalInvested > 0
    ? Math.round(((finalValue - totalInvested) / totalInvested) * 100)
    : 0
  const monthlyGain = averageMonthlyGain(rows, profitYear)

  // The reverse question, answered against the same inputs as the forward
  // projection above so "when do I reach X" and "what do I have after N
  // years" never disagree with each other.
  const goalMonths = useMemo(
    () => yearsToReach({ target, monthly, initial, rate, monthlyGrowthPct: growth }),
    [target, monthly, initial, rate, growth],
  )

  const goalText = useMemo(() => {
    const amount = formatCompactEur(target, locale)
    if (initial >= target) return t(locale, 'goalAlready', { amount })
    if (goalMonths == null) return t(locale, 'goalUnreachable', { amount })

    let wholeYears = Math.floor(goalMonths)
    let extraMonths = Math.round((goalMonths - wholeYears) * 12)
    // Rounding a fraction like 6.999 years can carry into a 13th month.
    if (extraMonths === 12) {
      wholeYears += 1
      extraMonths = 0
    }
    const duration = extraMonths === 0
      ? t(locale, 'goalDurationYearsOnly', { years: wholeYears })
      : t(locale, 'goalDuration', { years: wholeYears, months: extraMonths })
    return `${duration} · ${t(locale, 'goalReached', { amount })}`
  }, [target, initial, goalMonths, locale])

  const isDefault =
    years === DEFAULTS.years &&
    rate === DEFAULTS.rate &&
    monthly === DEFAULTS.monthly &&
    initial === DEFAULTS.initial &&
    growth === DEFAULTS.growth &&
    target === DEFAULTS.target

  const handleSave = useCallback(async () => {
    const params = new URLSearchParams({
      y: String(years),
      m: String(monthly),
      i: String(initial),
      r: String(rate),
      g: String(growth),
      t: String(target),
    })
    window.history.replaceState({}, '', `?${params}`)
    saveSettings({ years, monthly, initial, rate, growth, target })

    // Inside the native shell there is no ambient "paste this somewhere"
    // affordance the way a desktop browser has — a share sheet is what a
    // native app's "share this link" action is expected to do, so it
    // replaces the clipboard copy there rather than supplementing it.
    if (Capacitor.isNativePlatform()) {
      try {
        await Share.share({ title: t(locale, 'eyebrow'), url: window.location.href })
        hapticSuccess()
        setSavedVia('share')
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        return
      } catch {
        // Dismissed by the visitor, or genuinely unavailable — fall through
        // to the clipboard path below, same as the plain web experience.
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href)
      setSavedVia('clipboard')
    } catch {
      // Clipboard is blocked without a secure context or permission; the URL is
      // still updated, so the link remains shareable by hand.
      setSavedVia(null)
    }
    hapticSuccess()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [years, monthly, initial, rate, growth, target, locale])

  const handleReset = useCallback(() => {
    setYears(DEFAULTS.years)
    setRate(DEFAULTS.rate)
    setGrowth(DEFAULTS.growth)
    setMonthlyText(String(DEFAULTS.monthly))
    setInitialText(String(DEFAULTS.initial))
    setTargetText(String(DEFAULTS.target))
    setProfitYear(DEFAULTS.years)
    // Clear the query string too, otherwise a reload would restore the values
    // that were just discarded.
    window.history.replaceState({}, '', window.location.pathname)
    hapticLight()
  }, [])

  return (
    <div className="shell">
      <div className="container">
        <header>
          <div className="masthead">
            <div className="eyebrow">{t(locale, 'eyebrow')}</div>
            <div className="masthead-toggles">
              <LocaleToggle locale={locale} onToggle={toggleLocale} />
              <ThemeToggle theme={theme} onToggle={toggle} locale={locale} />
            </div>
          </div>
          <h1 className="title">
            S&amp;P 500 <span className="title-accent">{t(locale, 'titleAccent')}</span>
          </h1>
          <p className="lede">{t(locale, 'lede')}</p>
        </header>

        <Sxr8Chart palette={palette} locale={locale} />

        {/*
          Result first, then the controls that drive it. The projection chart
          used to sit between them, which pushed the stat cards off the top of
          the screen on a phone the moment a slider was within reach — you could
          not see the number you were changing.
        */}
        <div className="stats">
          <div className="stat">
            <div className="card-label">{t(locale, 'statFinalValue')}</div>
            <div className="stat-value stat-value--accent num">
              {formatCompactEur(finalValue, locale)}
            </div>
          </div>
          <div className="stat">
            <div className="card-label">{t(locale, 'statTotalInvested')}</div>
            <div className="stat-value num">{formatCompactEur(totalInvested, locale)}</div>
          </div>
          <div className="stat">
            <div className="card-label">{t(locale, 'statGains')}</div>
            <div className="stat-value stat-value--gain num">
              {formatCompactEur(last.gains, locale)}
              <span className="stat-pct">
                {gainPct >= 0 ? '+' : ''}
                {gainPct}%
              </span>
            </div>
          </div>
        </div>

        <ShareButton
          locale={locale}
          palette={palette}
          cardData={{ finalValue, totalInvested, gains: last.gains, gainPct, years, rate }}
        />

        <div className="controls">
          <div className="control--full">
            <div className="control-head">
              <label className="control-name" htmlFor="years">
                {t(locale, 'controlYears')}
              </label>
              <span className="control-value num">
                {t(locale, 'controlYearsValue', { n: years })}
              </span>
            </div>
            <input
              id="years"
              type="range"
              min={BOUNDS.years.min}
              max={BOUNDS.years.max}
              step={BOUNDS.years.step}
              value={years}
              aria-valuetext={t(locale, 'controlYearsAriaValue', { n: years })}
              onChange={(event) => {
                setYears(Number(event.target.value))
                hapticSelectionChanged()
              }}
            />
            <div className="scale">
              <span>{BOUNDS.years.min}</span>
              <span>{BOUNDS.years.max}</span>
            </div>
          </div>

          <div className="control--full">
            <div className="control-head">
              <label className="control-name" htmlFor="rate">
                {t(locale, 'controlRate')}
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
              aria-valuetext={t(locale, 'controlRateAriaValue', { n: rate })}
              onChange={(event) => {
                setRate(Number(event.target.value))
                hapticSelectionChanged()
              }}
            />
            <div className="scale">
              <span>{BOUNDS.rate.min}%</span>
              <span className="scale-mid">{t(locale, 'controlRateHint')}</span>
              <span>{BOUNDS.rate.max}%</span>
            </div>
          </div>

          <AmountField
            id="monthly"
            label={t(locale, 'fieldMonthly')}
            value={monthly}
            text={monthlyText}
            step={50}
            locale={locale}
            onChange={setMonthlyText}
            onCommit={() => setMonthlyText(String(monthly))}
          />

          <AmountField
            id="initial"
            label={t(locale, 'fieldInitial')}
            value={initial}
            text={initialText}
            step={500}
            locale={locale}
            onChange={setInitialText}
            onCommit={() => setInitialText(String(initial))}
          />

          <div className="control--full">
            <div className="control-head">
              <label className="control-name" htmlFor="growth">
                {t(locale, 'controlGrowth')}
              </label>
              <span className="control-value num">{growth}%</span>
            </div>
            <input
              id="growth"
              type="range"
              min={BOUNDS.growth.min}
              max={BOUNDS.growth.max}
              step={BOUNDS.growth.step}
              value={growth}
              aria-valuetext={t(locale, 'controlGrowthAriaValue', { n: growth })}
              onChange={(event) => {
                setGrowth(Number(event.target.value))
                hapticSelectionChanged()
              }}
            />
            <div className="scale">
              <span>{BOUNDS.growth.min}%</span>
              <span className="scale-mid">{t(locale, 'controlGrowthHint')}</span>
              <span>{BOUNDS.growth.max}%</span>
            </div>
          </div>
        </div>

        <div className="save-row">
          <button
            type="button"
            className={`save-btn${saved ? ' saved' : ''}`}
            onClick={handleSave}
          >
            {saved ? t(locale, 'saved') : t(locale, 'save')}
          </button>
          <button
            type="button"
            className="reset-btn"
            onClick={handleReset}
            disabled={isDefault}
            aria-label={t(locale, 'resetAriaLabel')}
          >
            {t(locale, 'reset')}
          </button>
          <span className="save-hint" role="status" aria-live="polite">
            {saved && savedVia === 'clipboard' ? t(locale, 'saveHint') : ''}
          </span>
        </div>

        <section className="panel projection" aria-label={t(locale, 'projectionAriaLabel')}>
          {/* The two areas were previously distinguishable only by hovering,
              which is a poor deal on a touch screen. */}
          <div className="legend">
            <span className="legend-item">
              <span className="legend-swatch" style={{ background: palette.accent }} />
              {t(locale, 'legendPortfolio')}
            </span>
            <span className="legend-item">
              <span className="legend-swatch" style={{ background: palette.invested }} />
              {t(locale, 'legendInvested')}
            </span>
          </div>
          <div className="projection-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={palette.accent} stopOpacity={palette.fillOpacity} />
                    <stop offset="95%" stopColor={palette.accent} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={palette.invested}
                      stopOpacity={palette.investedFillOpacity}
                    />
                    <stop offset="95%" stopColor={palette.invested} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="year"
                  tick={{ fill: palette.axisTick, fontSize: 10, fontFamily: 'Times New Roman' }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={isNarrow ? 18 : 8}
                />
                <YAxis
                  tickFormatter={(value) => formatAxisMoney(value, locale)}
                  tick={{ fill: palette.axisTick, fontSize: 10, fontFamily: 'Times New Roman' }}
                  tickLine={false}
                  axisLine={false}
                  width={isNarrow ? 38 : 52}
                />
                <Tooltip content={<ProjectionTooltip locale={locale} />} />
                <Area
                  type="monotone"
                  dataKey="invested"
                  name={t(locale, 'legendInvested')}
                  stroke={palette.invested}
                  strokeWidth={1.5}
                  fill="url(#investedGrad)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name={t(locale, 'legendPortfolio')}
                  stroke={palette.accent}
                  strokeWidth={2}
                  fill="url(#totalGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel income" aria-label={t(locale, 'incomeAriaLabel')}>
          <div className="income-head">
            <div>
              <div className="card-label">{t(locale, 'incomeLabel')}</div>
              <div className="income-value num">{formatCompactEur(monthlyGain, locale)}</div>
            </div>
            <div className="income-for">
              {t(locale, 'incomeForYear', {
                n: profitYear === 0 ? t(locale, 'incomeForYearZero') : profitYear,
              })}
            </div>
          </div>

          <div>
            <div className="control-head">
              <label className="control-name" htmlFor="profit-year">
                {t(locale, 'controlYear')}
              </label>
              <span className="control-value num">
                {t(locale, 'controlYearsValue', { n: profitYear })}
              </span>
            </div>
            <input
              id="profit-year"
              type="range"
              min={0}
              max={years}
              value={profitYear}
              aria-valuetext={t(locale, 'controlYearAriaValue', { year: profitYear, years })}
              onChange={(event) => {
                setProfitYear(Number(event.target.value))
                hapticSelectionChanged()
              }}
            />
            <div className="scale">
              <span>0</span>
              <span>{years}</span>
            </div>
          </div>
        </section>

        <section className="panel goal" aria-label={t(locale, 'goalAriaLabel')}>
          <div className="goal-heading">{t(locale, 'goalHeading')}</div>

          <AmountField
            id="target"
            label={t(locale, 'goalFieldLabel')}
            value={target}
            text={targetText}
            step={5000}
            locale={locale}
            onChange={setTargetText}
            onCommit={() => setTargetText(String(target))}
          />

          <p className="goal-result num">{goalText}</p>
        </section>

        <p className="disclaimer">{t(locale, 'disclaimer')}</p>

        {/*
          Plain in-bundle navigation, not target="_blank": both pages are
          static files copied into the same dist/ build (see public/), so on
          the native app they are already local and work offline — opening
          them in an external browser would be a regression, not a nicety.
        */}
        <p className="footer-links">
          <a href={locale === 'en' ? '/privacy-en.html' : '/privacy.html'}>
            {t(locale, 'footerPrivacy')}
          </a>
          <span aria-hidden="true"> · </span>
          <a href={locale === 'en' ? '/support-en.html' : '/support.html'}>
            {t(locale, 'footerSupport')}
          </a>
        </p>
      </div>
    </div>
  )
}
