/**
 * Monthly-compounded projection with a contribution at the end of each month.
 * One row per completed year, plus year 0 for the opening balance.
 *
 * The core arithmetic is deliberately unchanged from the original app.
 * `yearlyRaise` is new and defaults to 0, at which it is a no-op:
 * `monthly + 0 * n === monthly` for every n, so a horizon with no
 * contribution growth produces byte-identical rows to before — verified in
 * scratch/test-compound.mjs, not just argued from the formula.
 *
 * A flat €/year amount rather than a percentage: it is a fixed sum, not the
 * step size of a `for` loop, so the same 50€ raise means the same thing at
 * any starting monthly contribution instead of scaling with it the way a
 * percentage would.
 */
export function buildProjection({ years, monthly, initial, rate, yearlyRaise = 0 }) {
  const monthlyRate = rate / 100 / 12
  let total = initial
  let invested = initial

  const rows = [
    { year: 0, total: Math.round(total), invested: Math.round(invested), gains: 0 },
  ]

  const months = Math.round(years * 12)
  for (let month = 1; month <= months; month++) {
    // A raise lands at the start of each new year, not continuously —
    // matches how an actual salary-linked contribution increase works, and
    // keeps the first 12 months identical to the plain `monthly` case.
    const yearIndex = Math.floor((month - 1) / 12)
    const contribution = monthly + yearlyRaise * yearIndex
    total = total * (1 + monthlyRate) + contribution
    invested += contribution
    if (month % 12 === 0) {
      rows.push({
        year: month / 12,
        total: Math.round(total),
        invested: Math.round(invested),
        gains: Math.round(total - invested),
      })
    }
  }

  return rows
}

/**
 * Average monthly gain during a given year, i.e. that year's growth in gains
 * spread over twelve months. Contributions are already excluded because
 * `gains` is total minus invested.
 */
export function averageMonthlyGain(rows, year) {
  if (year <= 0 || year >= rows.length) return 0
  return Math.round((rows[year].gains - rows[year - 1].gains) / 12)
}

/**
 * The reverse question: not "what do I have after N years" but "how long
 * until I have X". Walks the same month-by-month compounding used above
 * (not a closed-form inverse) so it stays correct with contribution growth
 * and always agrees with the forward projection on the same inputs, rather
 * than risking drift between two separately-derived formulas.
 *
 * Returns a fractional year (e.g. 7.25 for "7 years, 3 months") the month
 * the running total first reaches `target`, or null if it does not happen
 * within `maxYears` — a flat or shrinking balance (zero contribution, zero
 * or negative real return) can make the target genuinely unreachable, and
 * that has to be a reportable answer, not an infinite loop.
 */
export function yearsToReach({ target, monthly, initial, rate, yearlyRaise = 0 }, maxYears = 100) {
  if (initial >= target) return 0

  const monthlyRate = rate / 100 / 12
  let total = initial
  const maxMonths = Math.round(maxYears * 12)

  for (let month = 1; month <= maxMonths; month++) {
    const yearIndex = Math.floor((month - 1) / 12)
    const contribution = monthly + yearlyRaise * yearIndex
    total = total * (1 + monthlyRate) + contribution
    if (total >= target) return month / 12
  }
  return null
}
