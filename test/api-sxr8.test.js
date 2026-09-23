import assert from 'node:assert/strict'
import { test } from 'node:test'
import handler from '../api/sxr8.js'

/**
 * Only the paths that answer without reaching Yahoo. A test that hit the real
 * upstream would fail on a plane, on a bad day at Yahoo, and in CI without
 * network — and would be testing Yahoo, not this handler.
 */
function mockRes() {
  return {
    statusCode: null,
    headers: {},
    body: undefined,
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value
      return this
    },
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
    end() {
      return this
    },
  }
}

const call = async (req) => {
  const res = mockRes()
  await handler({ headers: {}, query: {}, method: 'GET', ...req }, res)
  return res
}

test('a preflight from the native origin is answered without calling upstream', async () => {
  const res = await call({ method: 'OPTIONS', headers: { origin: 'capacitor://localhost' } })
  assert.equal(res.statusCode, 204)
  assert.equal(res.headers['access-control-allow-origin'], 'capacitor://localhost')
})

test('an unknown origin gets no CORS grant', async () => {
  const res = await call({ method: 'OPTIONS', headers: { origin: 'https://evil.example' } })
  assert.equal(res.headers['access-control-allow-origin'], undefined)
})

test('an unknown range is refused and the allowed ones are named', async () => {
  const res = await call({ query: { range: '3d' } })
  assert.equal(res.statusCode, 400)
  assert.ok(res.body.allowed.includes('5y'))
})

test('a range cannot smuggle arbitrary query state upstream', async () => {
  const res = await call({ query: { range: '1d&symbol=AAPL' } })
  assert.equal(res.statusCode, 400)
})
