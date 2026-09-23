import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  averageMonthlyGain,
  buildProjection,
  yearsToReach,
} from '../src/lib/compound.js'

test('year 0 is the opening balance, before any contribution', () => {
  const [first] = buildProjection({ years: 10, monthly: 200, initial: 1000, rate: 10.5 })
  assert.deepEqual(first, { year: 0, total: 1000, invested: 1000, gains: 0 })
})

test('one row per completed year, plus year 0', () => {
  const rows = buildProjection({ years: 7, monthly: 100, initial: 0, rate: 8 })
  assert.equal(rows.length, 8)
  assert.deepEqual(rows.map((row) => row.year), [0, 1, 2, 3, 4, 5, 6, 7])
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

test('a zero yearly raise is a no-op, so old links keep their numbers', () => {
  const input = { years: 25, monthly: 200, initial: 1000, rate: 10.5 }
  assert.deepEqual(
    buildProjection({ ...input, yearlyRaise: 0 }),
    buildProjection(input),
  )
})

test('the raise lands per year, not per month', () => {
  const rows = buildProjection({
    years: 3,
    monthly: 100,
    initial: 0,
    rate: 0,
    yearlyRaise: 50,
  })
  // 12×100, then 12×150, then 12×200 — at 0% the total is just the sum.
  assert.equal(rows[1].invested, 1200)
  assert.equal(rows[2].invested, 1200 + 1800)
  assert.equal(rows[3].invested, 1200 + 1800 + 2400)
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

test('yearsToReach agrees with the forward projection', () => {
  const input = { monthly: 200, initial: 1000, rate: 10.5 }
  const reached = yearsToReach({ ...input, target: 100_000 })
  const rows = buildProjection({ ...input, years: Math.ceil(reached) })
  // The month it first crosses is inside the last whole year of the run.
  assert.ok(rows.at(-1).total >= 100_000)
  assert.ok(reached > Math.ceil(reached) - 1)
})

test('a target already met takes no time at all', () => {
  assert.equal(yearsToReach({ target: 500, monthly: 100, initial: 500, rate: 5 }), 0)
})

test('an unreachable target reports null rather than looping forever', () => {
  assert.equal(
    yearsToReach({ target: 1_000_000, monthly: 0, initial: 100, rate: 0 }),
    null,
  )
})
