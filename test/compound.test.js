import assert from 'node:assert/strict'
import { test } from 'node:test'
import { averageMonthlyGain, buildProjection } from '../src/lib/compound.js'

test('year 0 is the opening balance, before any contribution', () => {
  const [first] = buildProjection({ years: 10, monthly: 200, initial: 1000, rate: 10.5 })
  assert.deepEqual(first, { year: 0, total: 1000, invested: 1000, gains: 0 })
})

test('one row per completed year, plus year 0', () => {
  const rows = buildProjection({ years: 7, monthly: 100, initial: 0, rate: 8 })
  assert.equal(rows.length, 8)
  assert.deepEqual(
    rows.map((row) => row.year),
    [0, 1, 2, 3, 4, 5, 6, 7],
  )
})

test('at 0% growth the portfolio is exactly what was paid in', () => {
  const rows = buildProjection({ years: 3, monthly: 100, initial: 500, rate: 0 })
  const last = rows.at(-1)
  assert.equal(last.invested, 500 + 100 * 36)
  assert.equal(last.total, last.invested)
  assert.equal(last.gains, 0)
})

test('a lump sum with no contributions compounds monthly', () => {
  const rows = buildProjection({ years: 1, monthly: 0, initial: 1000, rate: 12 })
  // 1000 * (1 + 0.12/12)^12 = 1126.83
  assert.equal(rows.at(-1).total, 1127)
})

test('gains are the part of the total that was not paid in', () => {
  const rows = buildProjection({ years: 20, monthly: 200, initial: 1000, rate: 10.5 })
  for (const row of rows) {
    assert.equal(row.gains, row.total - row.invested)
  }
})

test('averageMonthlyGain spreads one year of growth over twelve months', () => {
  const rows = buildProjection({ years: 5, monthly: 200, initial: 1000, rate: 10.5 })
  assert.equal(
    averageMonthlyGain(rows, 3),
    Math.round((rows[3].gains - rows[2].gains) / 12),
  )
})

test('averageMonthlyGain refuses years outside the projection', () => {
  const rows = buildProjection({ years: 5, monthly: 200, initial: 1000, rate: 10.5 })
  assert.equal(averageMonthlyGain(rows, 0), 0)
  assert.equal(averageMonthlyGain(rows, -1), 0)
  // Shortening the horizon used to leave the profit-year slider past the end.
  assert.equal(averageMonthlyGain(rows, 99), 0)
})
