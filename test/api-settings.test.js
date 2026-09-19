import assert from 'node:assert/strict'
import { test } from 'node:test'

// Set before the handler is imported: api/_lib/clerk-auth.js reads the secret
// at module load, and an unset one short-circuits every request to 503.
process.env.CLERK_SECRET_KEY = 'sk_test_not_a_real_key'

const { default: handler } = await import('../api/settings.js')

/** The slice of Vercel's res the handler actually touches. */
function mockRes() {
  const res = {
    statusCode: null,
    headers: {},
    body: undefined,
    ended: false,
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
      this.ended = true
      return this
    },
    end() {
      this.ended = true
      return this
    },
  }
  return res
}

const call = async (req) => {
  const res = mockRes()
  await handler({ headers: {}, ...req }, res)
  return res
}

test('a preflight from the native origin is answered, not processed', async () => {
  const res = await call({ method: 'OPTIONS', headers: { origin: 'https://localhost' } })
  assert.equal(res.statusCode, 204)
  assert.equal(res.headers['access-control-allow-origin'], 'https://localhost')
  assert.match(res.headers['access-control-allow-methods'], /PUT/)
  assert.match(res.headers['access-control-allow-headers'], /Authorization/)
})

test('an unknown origin gets no CORS grant', async () => {
  const res = await call({ method: 'OPTIONS', headers: { origin: 'https://evil.example' } })
  assert.equal(res.statusCode, 204)
  assert.equal(res.headers['access-control-allow-origin'], undefined)
})

test('Vary: Origin is always set, so one origin cannot be served another cache entry', async () => {
  const res = await call({ method: 'GET' })
  assert.equal(res.headers.vary, 'Origin')
})

test('settings are never held by a shared cache', async () => {
  const res = await call({ method: 'GET' })
  assert.equal(res.headers['cache-control'], 'private, no-store')
})

test('no Authorization header is a 401, not a 500', async () => {
  const res = await call({ method: 'GET' })
  assert.equal(res.statusCode, 401)
  assert.ok(res.body.error)
})

test('a malformed bearer token is a 401 and says nothing about why', async () => {
  const res = await call({
    method: 'GET',
    headers: { authorization: 'Bearer not.a.jwt' },
  })
  assert.equal(res.statusCode, 401)
  // The reason (expired, bad signature, wrong party) must not leak back.
  assert.ok(!/signature|expired|jwt/i.test(res.body.error))
})

test('an unsupported method is rejected before the token is even read', async () => {
  const res = await call({ method: 'DELETE', headers: { authorization: 'Bearer x' } })
  assert.equal(res.statusCode, 405)
})

test('a write without a token never reaches the body', async () => {
  const res = await call({
    method: 'PUT',
    body: { settings: { years: 999 } },
  })
  assert.equal(res.statusCode, 401)
})
