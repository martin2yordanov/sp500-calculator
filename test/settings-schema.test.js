import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  BOUNDS,
  DEFAULTS,
  sanitizeSetting,
  sanitizeSettings,
  settingsEqual,
} from '../shared/settings-schema.js'

test('garbage falls back to the default rather than to NaN', () => {
  assert.equal(sanitizeSetting('abc', 'years'), DEFAULTS.years)
  assert.equal(sanitizeSetting(undefined, 'rate'), DEFAULTS.rate)
  assert.equal(sanitizeSetting(null, 'monthly'), DEFAULTS.monthly)
  assert.equal(sanitizeSetting(Infinity, 'initial'), DEFAULTS.initial)
})

test('values outside the bounds are clamped, not rejected', () => {
  assert.equal(sanitizeSetting(999, 'years'), BOUNDS.years.max)
  assert.equal(sanitizeSetting(-5, 'years'), BOUNDS.years.min)
  assert.equal(sanitizeSetting(-1, 'monthly'), BOUNDS.monthly.min)
  assert.equal(sanitizeSetting(1e12, 'initial'), BOUNDS.initial.max)
})

test('years is always a whole number of years', () => {
  assert.equal(sanitizeSetting('12.7', 'years'), 13)
  assert.equal(sanitizeSetting(3.2, 'years'), 3)
})

test('numeric strings are accepted, which is what URL params are', () => {
  assert.equal(sanitizeSetting('10.5', 'rate'), 10.5)
  assert.equal(sanitizeSetting('250', 'monthly'), 250)
})

test('sanitizeSettings always returns every key', () => {
  const result = sanitizeSettings({ years: 5 })
  assert.deepEqual(Object.keys(result).sort(), Object.keys(DEFAULTS).sort())
  assert.equal(result.years, 5)
  assert.equal(result.rate, DEFAULTS.rate)
})

test('sanitizeSettings survives what a hostile request body can be', () => {
  assert.deepEqual(sanitizeSettings(null), DEFAULTS)
  assert.deepEqual(sanitizeSettings('nope'), DEFAULTS)
  assert.deepEqual(sanitizeSettings([]), DEFAULTS)
  // A prototype-polluting payload must not survive into stored settings.
  const result = sanitizeSettings(JSON.parse('{"__proto__":{"x":1},"years":3}'))
  assert.deepEqual(Object.keys(result).sort(), Object.keys(DEFAULTS).sort())
  assert.equal(result.years, 3)
})

test('settingsEqual compares by value and rejects partials', () => {
  assert.ok(settingsEqual(DEFAULTS, { ...DEFAULTS }))
  assert.ok(!settingsEqual(DEFAULTS, { ...DEFAULTS, years: 21 }))
  assert.ok(!settingsEqual(DEFAULTS, null))
  assert.ok(!settingsEqual(null, null))
})
