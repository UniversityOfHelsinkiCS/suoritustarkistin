/**
 * Shared setup for the node:test integration suites.
 *
 * The importer's axios instance and the Sequelize client both read their config at require
 * time, so this file must be required before anything else under server/.
 */
process.env.NODE_ENV = 'test'

const http = require('http')
const express = require('express')

require('module-alias/register')

// Pinned at loopback and stripped of any real credential, so a suite cannot reach a live
// importer or put a token on the wire.
const IMPORTER_PORT = 9588
process.env.IMPORTER_DB_API_URL = `http://127.0.0.1:${IMPORTER_PORT}/`
process.env.POST_IMPORTER_DB_API_URL = `http://127.0.0.1:${IMPORTER_PORT}/`
delete process.env.IMPORTER_DB_API_TOKEN

// A stand-in for importer-db-api. `requests` records what was actually asked for, which is
// how the suites assert on batching and de-duplication.
const importer = {
  requests: [],
  handle: (_req, res) => res.end('[]'),
  reset() {
    this.requests = []
    this.handle = (_req, res) => res.end('[]')
  },
  respondWith(body) {
    this.handle = (_req, res) => res.end(JSON.stringify(body))
  },
  // Unmapped paths fail loudly rather than returning an empty array that looks real.
  respondByPath(routes) {
    this.handle = (req, res) => {
      const match = Object.keys(routes).find((path) => req.url.startsWith(path))
      if (!match) {
        res.writeHead(500)
        return res.end(JSON.stringify({ error: `no fixture for ${req.url}` }))
      }
      const body = routes[match]
      return res.end(JSON.stringify(typeof body === 'function' ? body(req) : body))
    }
  }
}

let importerServer

const startImporter = () =>
  new Promise((resolve) => {
    importerServer = http.createServer((req, res) => {
      const chunks = []
      req.on('data', (chunk) => chunks.push(chunk))
      req.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8')
        importer.requests.push({ url: req.url, method: req.method, body: raw ? JSON.parse(raw) : undefined })
        res.setHeader('content-type', 'application/json')
        importer.handle(req, res)
      })
    })
    importerServer.listen(IMPORTER_PORT, '127.0.0.1', resolve)
  })

const stopImporter = () =>
  importerServer ? new Promise((resolve) => importerServer.close(resolve)) : Promise.resolve()

let appServer
let baseUrl

// Mounts `router` as server/index.js does, including the body-parser error handler: the
// malformed-body behaviour only exists at app level.
const startApp = async (router) => {
  const app = express()
  app.use(express.json({ limit: '5mb' }))
  app.use((err, req, res, next) => {
    if (err?.type === 'entity.parse.failed')
      return res.status(400).json({ error: { code: 'malformedRequest', message: 'Request body is not valid JSON.' } })
    if (err?.type === 'entity.too.large')
      return res.status(413).json({ error: { code: 'requestTooLarge', message: 'Request body is too large.' } })
    return next(err)
  })
  app.use('/api', router)
  app.use((_req, res) => res.status(404).send({ error: 'Not found' }))

  await new Promise((resolve) => {
    appServer = app.listen(0, '127.0.0.1', resolve)
  })
  baseUrl = `http://127.0.0.1:${appServer.address().port}`
  return baseUrl
}

// Guarded: when startup failed, `after` still runs, and an unguarded close throws over
// the top of the error that actually matters.
const stopApp = () => (appServer ? new Promise((resolve) => appServer.close(resolve)) : Promise.resolve())

// The real /api router behind the real user middleware, for the suites that need a
// logged-in user.
const startFullApp = async () => {
  const routes = require('@server/utils/routes')
  const { parseUser, currentUser } = require('@server/utils/middleware')

  const app = express()
  app.use(express.json({ limit: '5mb' }))
  app.use(parseUser)
  app.use(currentUser)
  app.use('/api', routes)
  app.use((_req, res) => res.status(404).send({ error: 'Not found' }))

  await new Promise((resolve) => {
    appServer = app.listen(0, '127.0.0.1', resolve)
  })
  baseUrl = `http://127.0.0.1:${appServer.address().port}`
  return baseUrl
}

// parseUser resolves a role by looking employeeId up in the users table -- its isAdmin
// default only fires for a user it has to create -- so these rows must exist first.
const seedTestUsers = async () => {
  const { testUsers } = require('@server/utils/common')
  const db = require('@server/models')
  await db.users.bulkCreate(testUsers.map((user) => ({ ...user, employeeId: String(user.employeeId) })))
}

// Shibboleth headers for the seeded roles.
const AS_ADMIN = { employeenumber: '1111', uid: 'admin', mail: 'admin@helsinki.fi', givenname: 'admin', sn: 'admin' }
const AS_GRADER = {
  employeenumber: '9111111',
  uid: 'grader',
  mail: 'grader@helsinki.fi',
  givenname: 'grader',
  sn: 'grader'
}

const request = async (method, path, { body, headers = {} } = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  const text = await response.text()
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    parsed = text
  }
  return { status: response.status, body: parsed }
}

// `rawBody` sends a string unchanged, which is how the malformed-JSON cases are written.
const post = async (path, body, { token, bearer, rawBody } = {}) => {
  const headers = { 'content-type': 'application/json' }
  if (bearer !== undefined) headers.authorization = `Bearer ${bearer}`
  else if (token) headers.token = token

  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers,
    body: rawBody !== undefined ? rawBody : JSON.stringify(body)
  })

  const text = await response.text()
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    parsed = text
  }
  return { status: response.status, body: parsed }
}

/**
 * These suites TRUNCATE, so a wrong target destroys real data. TEST_DATABASE_URL exists so
 * a DATABASE_URL in a developer's .env can never be selected; this catches the remaining
 * way to get it wrong, pointing both at the same place by hand.
 */
const assertSafeTestDatabase = () => {
  if (process.env.NODE_ENV !== 'test')
    throw new Error(`Refusing to run integration tests with NODE_ENV=${process.env.NODE_ENV}`)

  // Demanded explicitly rather than falling back to config's e2e-db default, which only
  // resolves inside the compose stack and otherwise fails as an opaque DNS error.
  if (!process.env.TEST_DATABASE_URL)
    throw new Error(
      'TEST_DATABASE_URL is not set, so there is no database to test against.\n' +
        '  Run `npm run test:integration:local`, which starts a throwaway Postgres and sets it for you.\n' +
        '  CI sets it directly; see .github/workflows/ci.yml.'
    )

  const target = require('../../config/config').test.database_url
  if (process.env.DATABASE_URL && process.env.DATABASE_URL === target)
    throw new Error(
      'Refusing to run integration tests: TEST_DATABASE_URL points at the same database as DATABASE_URL. ' +
        'These suites truncate every table, so the target must be a throwaway database.'
    )

  return target
}

// initializeDatabaseConnection is not reusable here: it calls process.exit(1) on failure,
// which would kill the test runner instead of failing the suite.
const connectDatabase = async () => {
  const target = assertSafeTestDatabase()
  const { sequelize } = require('@server/models')
  const { runMigrations } = require('@server/database/connection')

  try {
    await sequelize.authenticate()
  } catch (error) {
    throw new Error(
      `Could not reach the test database at ${target}: ${error.message}\n` +
        '  Run `npm run test:db` to start one, or `npm run test:integration:local` to do both.',
      { cause: error }
    )
  }

  await runMigrations()
  return sequelize
}

/**
 * Sequelize keeps pooled connections open for its idle timeout, which holds the event loop
 * -- and so the test process -- alive for ten seconds after the last assertion. Every suite
 * that connects must close.
 */
const disconnectDatabase = () => require('@server/models').sequelize.close()

/**
 * The suites share one database, so test:integration runs with --test-concurrency=1:
 * without it a truncate here destroys fixtures another file is midway through using.
 * SequelizeMeta is left alone, so migrations are not re-run between tests.
 */
const truncateDatabase = async () => {
  assertSafeTestDatabase()
  const { sequelize } = require('@server/models')
  await sequelize.query(
    'TRUNCATE entries, extra_entries, raw_entries, users_courses, courses, users, api_keys, credits, reports, jobs RESTART IDENTITY CASCADE'
  )
}

// Returns [record, token]. Overrides let a test ask for a revoked or expired key.
const createTestApiKey = async (overrides = {}) => {
  const { createApiKey, MOOCFI_CLIENT } = require('@server/utils/apiKeys')
  const [apiKey, token] = await createApiKey({
    name: 'test key',
    client: MOOCFI_CLIENT,
    createdById: null,
    ...overrides
  })
  if (overrides.revokedAt) await apiKey.update({ revokedAt: overrides.revokedAt })
  return [apiKey, token]
}

module.exports = {
  assertSafeTestDatabase,
  createTestApiKey,
  connectDatabase,
  disconnectDatabase,
  truncateDatabase,
  IMPORTER_PORT,
  importer,
  startImporter,
  stopImporter,
  seedTestUsers,
  startApp,
  startFullApp,
  stopApp,
  post,
  request,
  AS_ADMIN,
  AS_GRADER
}
