/**
 * Monthly-compounded projection with a contribution at the end of each month.
 * One row per completed year, plus year 0 for the opening balance.
 *
 * The arithmetic here is deliberately unchanged from the original app — only
 * its packaging moved — so previously saved links keep producing the same
 * numbers they always did.
 */
export function buildProjection({ years, monthly, initial, rate }) {
  const monthlyRate = rate / 100 / 12
  let total = initial
  let invested = initial

  const rows = [
    { year: 0, total: Math.round(total), invested: Math.round(invested), gains: 0 },
  ]

  const months = Math.round(years * 12)
  for (let month = 1; month <= months; month++) {
    total = total * (1 + monthlyRate) + monthly
    invested = initial + monthly * month
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
