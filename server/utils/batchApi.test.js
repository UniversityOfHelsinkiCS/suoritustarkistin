/**
 * The batch envelope and the mooc.fi machine auth, driven over loopback because the
 * malformed-body response and the 401 shape come from middleware, not from the handler.
 *
 * The invariant: a well-formed, authenticated batch always gets HTTP 200 and exactly one
 * result per request item, in order. Anything else and the caller cannot tell which of
 * its items succeeded.
 */
const { test, before, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')

const { startApp, stopApp, post, connectDatabase, truncateDatabase, createTestApiKey } = require('../test/helpers')

const Router = require('express')
const { okItem, errorItem, batchHandler, MAX_BATCH_SIZE } = require('./batchApi')
const { checkMoocfiToken } = require('./permissions')
const { MOOCFI_PATHS } = require('./moocfiRoutes')

// Stand-in endpoints with the same wiring as a real one: same guard, same envelope.
const router = Router()
router.use(MOOCFI_PATHS, checkMoocfiToken)
router.post(
  '/persons/explode',
  batchHandler(async () => {
    throw new Error('importer is on fire')
  })
)
router.post(
  '/persons/echo',
  batchHandler(async (items) =>
    items.map(({ requestItemId, fail }) =>
      fail
        ? errorItem(requestItemId, 'personNotFound', 'No Sisu person was found for the supplied student number.')
        : okItem(requestItemId, 'personFound', { requestItemId })
    )
  )
)

let token

before(async () => {
  await connectDatabase()
  await startApp(router)
})
after(() => stopApp())

beforeEach(async () => {
  await truncateDatabase()
  ;[, token] = await createTestApiKey()
})

describe('authentication', () => {
  test('accepts a valid key in the token header', async () => {
    const { status } = await post('/api/persons/echo', [], { token })

    assert.equal(status, 200)
  })

  test('accepts a valid key as a bearer credential', async () => {
    const { status } = await post('/api/persons/echo', [], { bearer: token })

    assert.equal(status, 200, 'Authorization: Bearer is the shape the spec describes')
  })

  test('rejects a request with no credentials', async () => {
    const { status, body } = await post('/api/persons/echo', [])

    assert.equal(status, 401)
    assert.deepEqual(body, { error: { code: 'unauthorized', message: 'Missing or invalid credentials.' } })
  })

  test('rejects an unknown token', async () => {
    const { status, body } = await post('/api/persons/echo', [], { token: 'suotar_not-a-real-key' })

    assert.equal(status, 401)
    assert.equal(body.error.code, 'unauthorized')
  })

  test('rejects a revoked key on the very next request', async () => {
    const [doomedKey, doomedToken] = await createTestApiKey({ name: 'doomed' })
    const [, liveToken] = await createTestApiKey({ name: 'still live' })

    assert.equal((await post('/api/persons/echo', [], { token: doomedToken })).status, 200)

    await doomedKey.update({ revokedAt: new Date() })

    assert.equal((await post('/api/persons/echo', [], { token: doomedToken })).status, 401)
    assert.equal(
      (await post('/api/persons/echo', [], { token: liveToken })).status,
      200,
      'revoking one key must not disturb the others, which is what makes rotation safe'
    )
  })

  test('rejects an expired key', async () => {
    const [, expiredToken] = await createTestApiKey({ name: 'expired', expiresAt: new Date(Date.now() - 1000) })

    const { status } = await post('/api/persons/echo', [], { token: expiredToken })

    assert.equal(status, 401)
  })

  test('accepts a key whose expiry is still in the future', async () => {
    const [, futureToken] = await createTestApiKey({ name: 'future', expiresAt: new Date(Date.now() + 60_000) })

    const { status } = await post('/api/persons/echo', [], { token: futureToken })

    assert.equal(status, 200)
  })

  test('records when a key was last used', async () => {
    const [apiKey, freshToken] = await createTestApiKey({ name: 'tracked' })
    assert.equal(apiKey.lastUsedAt, null)

    await post('/api/persons/echo', [], { token: freshToken })

    await apiKey.reload()
    assert.ok(apiKey.lastUsedAt, 'lastUsedAt is how an admin confirms a rotation landed')
  })

  test('rejects a valid key issued to a different client', async () => {
    const [, otherToken] = await createTestApiKey({ name: 'some other system', client: 'other-service' })

    const { status, body } = await post('/api/persons/echo', [], { token: otherToken })

    assert.equal(status, 401)
    assert.equal(body.error.code, 'unauthorized')
  })
})

describe('request-level errors', () => {
  test('answers malformed JSON with malformedRequest', async () => {
    const { status, body } = await post('/api/persons/echo', undefined, { token, rawBody: '[{"requestItemId":' })

    assert.equal(status, 400)
    assert.equal(body.error.code, 'malformedRequest')
  })

  test('rejects a body that is not an array', async () => {
    const { status, body } = await post('/api/persons/echo', { requestItemId: 'a1' }, { token })

    assert.equal(status, 400)
    assert.equal(body.error.code, 'malformedRequest')
  })

  test('rejects an item with no requestItemId', async () => {
    const { status, body } = await post('/api/persons/echo', [{ requestItemId: 'a1' }, { studentNumber: '1' }], {
      token
    })

    assert.equal(status, 400)
    assert.equal(body.error.code, 'malformedRequest')
    assert.match(body.error.message, /index 1/, 'the caller needs to know which item is wrong')
  })

  test('rejects duplicate requestItemIds', async () => {
    const { status, body } = await post('/api/persons/echo', [{ requestItemId: 'a1' }, { requestItemId: 'a1' }], {
      token
    })

    assert.equal(status, 400)
    assert.equal(body.error.code, 'malformedRequest')
  })

  test('rejects a batch over the size ceiling', async () => {
    const items = Array.from({ length: MAX_BATCH_SIZE + 1 }, (_, i) => ({ requestItemId: `a${i}` }))

    const { status, body } = await post('/api/persons/echo', items, { token })

    assert.equal(status, 400)
    assert.equal(body.error.code, 'malformedRequest')
  })

  test('answers a handler that throws with the request-level error shape', async () => {
    const { status, body } = await post('/api/persons/explode', [{ requestItemId: 'a1' }], { token })

    assert.equal(status, 500)
    assert.equal(body.error.code, 'internalError')
    assert.ok(!JSON.stringify(body).includes('importer is on fire'), 'internals must not leak to the caller')
  })

  test('accepts a batch exactly at the ceiling', async () => {
    const items = Array.from({ length: MAX_BATCH_SIZE }, (_, i) => ({ requestItemId: `a${i}` }))

    const { status, body } = await post('/api/persons/echo', items, { token })

    assert.equal(status, 200)
    assert.equal(body.length, MAX_BATCH_SIZE)
  })
})

describe('the envelope', () => {
  test('returns one item per request item, in request order', async () => {
    const items = [{ requestItemId: 'c3' }, { requestItemId: 'a1' }, { requestItemId: 'b2' }]

    const { status, body } = await post('/api/persons/echo', items, { token })

    assert.equal(status, 200)
    assert.deepEqual(
      body.map(({ requestItemId }) => requestItemId),
      ['c3', 'a1', 'b2'],
      'results are paired with requests by position as well as by id'
    )
  })

  test('carries per-item failures at HTTP 200', async () => {
    const items = [{ requestItemId: 'a1' }, { requestItemId: 'b2', fail: true }]

    const { status, body } = await post('/api/persons/echo', items, { token })

    assert.equal(status, 200, 'a failed item is not a failed request')
    assert.deepEqual(body[0], {
      requestItemId: 'a1',
      status: 'ok',
      code: 'personFound',
      result: { requestItemId: 'a1' }
    })
    assert.deepEqual(body[1], {
      requestItemId: 'b2',
      status: 'error',
      code: 'personNotFound',
      error: { message: 'No Sisu person was found for the supplied student number.' }
    })
  })

  test('answers an empty batch with an empty array', async () => {
    const { status, body } = await post('/api/persons/echo', [], { token })

    assert.equal(status, 200)
    assert.deepEqual(body, [])
  })
})
