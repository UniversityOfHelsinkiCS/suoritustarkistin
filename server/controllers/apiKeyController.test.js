/**
 * Issuing and revoking machine credentials. The invariants: the plaintext leaves the
 * server exactly once, the hash never leaves it at all, and only admins can do any of it.
 */
const { test, before, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')

const {
  connectDatabase,
  truncateDatabase,
  startFullApp,
  seedTestUsers,
  stopApp,
  request,
  AS_ADMIN,
  AS_GRADER
} = require('../test/helpers')

const db = require('@server/models')
const { hashToken, TOKEN_PREFIX } = require('@server/utils/apiKeys')

const asAdmin = (method, path, body) => request(method, path, { body, headers: AS_ADMIN })

before(async () => {
  await connectDatabase()
  await startFullApp()
})
after(() => stopApp())
beforeEach(async () => {
  await truncateDatabase()
  await seedTestUsers()
})

describe('creating a key', () => {
  test('returns the token once, and stores only its hash', async () => {
    const { status, body } = await asAdmin('POST', '/api/api_keys', { name: 'courses.mooc.fi', client: 'moocfi' })

    assert.equal(status, 201)
    assert.ok(body.token.startsWith(TOKEN_PREFIX), 'the prefix is what makes a leaked key recognisable')
    assert.ok(body.token.length > 40, 'the token must carry real entropy')

    const stored = await db.api_keys.findByPk(body.apiKey.id)
    assert.equal(stored.tokenHash, hashToken(body.token))
    assert.ok(!JSON.stringify(body.apiKey).includes(body.token), 'the record must not echo the plaintext')
  })

  test('never exposes the token or its hash again', async () => {
    const { body: created } = await asAdmin('POST', '/api/api_keys', { name: 'k', client: 'moocfi' })

    const { body: listed } = await asAdmin('GET', '/api/api_keys')

    const serialized = JSON.stringify(listed)
    assert.ok(!serialized.includes(created.token), 'listing must never carry the plaintext')
    assert.ok(!serialized.includes('tokenHash'), 'nor the hash')
    assert.equal(listed[0].prefix, created.apiKey.prefix, 'the prefix is what identifies a key on screen')
  })

  test('records who issued it', async () => {
    const { body } = await asAdmin('POST', '/api/api_keys', { name: 'k', client: 'moocfi' })

    const { body: listed } = await asAdmin('GET', '/api/api_keys')
    assert.equal(listed[0].createdBy.name, 'admin')
    assert.ok(body.apiKey.createdById)
  })

  test('rejects a key with no name or client', async () => {
    assert.equal((await asAdmin('POST', '/api/api_keys', { client: 'moocfi' })).status, 400)
    assert.equal((await asAdmin('POST', '/api/api_keys', { name: 'k' })).status, 400)
  })
})

describe('revoking a key', () => {
  test('marks it revoked and records who did it', async () => {
    const { body: created } = await asAdmin('POST', '/api/api_keys', { name: 'k', client: 'moocfi' })

    const { status, body } = await asAdmin('DELETE', `/api/api_keys/${created.apiKey.id}`)

    assert.equal(status, 200)
    assert.ok(body.revokedAt)
    assert.equal(body.active, false)

    const stored = await db.api_keys.findByPk(created.apiKey.id)
    assert.ok(stored, 'the row survives revocation, so the audit trail does too')
    assert.ok(stored.revokedById)
  })

  test('keeps the original revocation time when revoked twice', async () => {
    const { body: created } = await asAdmin('POST', '/api/api_keys', { name: 'k', client: 'moocfi' })
    const { body: first } = await asAdmin('DELETE', `/api/api_keys/${created.apiKey.id}`)

    const { body: second } = await asAdmin('DELETE', `/api/api_keys/${created.apiKey.id}`)

    assert.equal(new Date(second.revokedAt).getTime(), new Date(first.revokedAt).getTime())
  })

  test('404s for a key that does not exist', async () => {
    assert.equal((await asAdmin('DELETE', '/api/api_keys/9999')).status, 404)
  })
})

describe('authorization', () => {
  test('a grader cannot list, create or revoke', async () => {
    const { body: created } = await asAdmin('POST', '/api/api_keys', { name: 'k', client: 'moocfi' })

    for (const [method, path, body] of [
      ['GET', '/api/api_keys'],
      ['POST', '/api/api_keys', { name: 'x', client: 'moocfi' }],
      ['DELETE', `/api/api_keys/${created.apiKey.id}`]
    ]) {
      const { status } = await request(method, path, { body, headers: AS_GRADER })
      assert.equal(status, 401, `${method} ${path} must be admin-only`)
    }
  })

  test('an anonymous caller cannot list', async () => {
    assert.equal((await request('GET', '/api/api_keys')).status, 401)
  })
})
