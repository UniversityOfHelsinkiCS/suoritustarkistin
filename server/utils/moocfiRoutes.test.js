/**
 * How the mooc.fi router is mounted into the real /api route table. Runs against the real
 * routes.js: a stub router assembled in a test file proves only that the test file is
 * wired correctly.
 *
 * Which guard answered is visible in the body -- checkGrader replies
 * { error: 'Unauthorized access' }, the mooc.fi guard { error: { code, message } } -- and
 * that difference is what the assertions lean on.
 */
const { test, before, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')

const {
  connectDatabase,
  truncateDatabase,
  seedTestUsers,
  createTestApiKey,
  startFullApp,
  stopApp,
  request,
  AS_ADMIN
} = require('../test/helpers')

const { MOOCFI_PATHS } = require('./moocfiRoutes')

const SPEC_PATHS = [
  '/api/persons/resolve-by-student-numbers',
  '/api/enrolments/resolve',
  '/api/enrolments/list-by-course',
  '/api/attainments/import',
  '/api/attainments/verify',
  '/api/open-university-product-access-tokens/resolve'
]

let token

before(async () => {
  await connectDatabase()
  await startFullApp()
})
after(() => stopApp())

beforeEach(async () => {
  await truncateDatabase()
  await seedTestUsers()
  ;[, token] = await createTestApiKey()
})

const post = (path, headers = {}) => request('POST', path, { body: [], headers })

describe('the guard covers the spec paths', () => {
  test('every prefix the spec uses is guarded', () => {
    for (const path of SPEC_PATHS) {
      const prefix = MOOCFI_PATHS.find((p) => path.startsWith(`/api${p}`))
      assert.ok(prefix, `${path} is not covered by MOOCFI_PATHS, so it would fall through to checkGrader`)
    }
  })

  test('answers an unauthenticated batch call with the spec 401 body', async () => {
    for (const path of SPEC_PATHS) {
      const { status, body } = await post(path)

      assert.equal(status, 401, path)
      assert.deepEqual(
        body,
        { error: { code: 'unauthorized', message: 'Missing or invalid credentials.' } },
        `${path} must be answered by the mooc.fi guard, not by checkGrader`
      )
    }
  })

  test('lets an authenticated call through the guard', async () => {
    // No endpoints yet, and an unmatched /api path falls through to graderOrAdminRouter,
    // so these still answer 401 -- but with checkGrader's body. That is the evidence the
    // credential was accepted.
    for (const path of SPEC_PATHS) {
      const { status, body } = await post(path, { token })

      assert.notDeepEqual(
        body,
        { error: { code: 'unauthorized', message: 'Missing or invalid credentials.' } },
        `${path} rejected a valid credential`
      )
      assert.notEqual(status, 500, `${path} should not error`)
    }
  })
})

describe('the guard is not global', () => {
  test('leaves an unauthenticated public route alone', async () => {
    const { status, body } = await request('GET', '/api/status')

    assert.equal(status, 200, 'mounting the guard at the router root would 401 this')
    assert.equal(body.inMaintenance, false)
  })

  test('leaves grader routes to checkGrader', async () => {
    const { status, body } = await request('GET', '/api/courses')

    assert.equal(status, 401)
    assert.equal(body.error, 'Unauthorized access', 'this 401 must come from checkGrader, not the mooc.fi guard')
  })

  test('an admin can still use the rest of the api', async () => {
    const { status } = await request('GET', '/api/api_keys', { headers: AS_ADMIN })

    assert.equal(status, 200, 'the mooc.fi guard must not stand in front of the admin routes')
  })

  test('a mooc.fi credential does not open the rest of the api', async () => {
    const { status, body } = await request('GET', '/api/api_keys', { headers: { token } })

    assert.equal(status, 401)
    assert.equal(body.error, 'Unauthorized access')
  })
})
