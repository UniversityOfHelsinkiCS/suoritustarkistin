/**
 * Integration tests for the Sisu send path. Run with `npm run test:integration`.
 *
 * Uses node:test and talks to a real local HTTP server rather than a mocked axios.
 * The regression these tests exist for was a `JSON.stringify` of a genuine axios response,
 * which is circular via request -> agent -> socket -> _httpMessage. A mocked client
 * returning a plain object would not reproduce it.
 *
 * The database and the importer lookup are stubbed so the suite stays runnable without
 * Postgres. That is the deliberate trade: these cover the send/record flow, not
 * sequelize behaviour.
 *
 * The invariant under test: if Sisu accepted the attainments, the entries must end up
 * recorded as sent. Anything that throws between the POST returning and updateSuccess
 * completing leaves Sisu holding data we believe was never sent.
 */
process.env.NODE_ENV = 'test'
process.env.SEND_TO_SISU = 'true'

const { test, before, after, beforeEach } = require('node:test')
const assert = require('node:assert')
const http = require('http')

require('module-alias/register')

const PORT = 9587
// Pin the target at loopback and drop any real token the shell may be carrying, so
// the suite cannot reach a real importer or put a live credential on the wire even
// if it is run from an environment configured for one.
process.env.POST_IMPORTER_DB_API_URL = `http://127.0.0.1:${PORT}/`
delete process.env.IMPORTER_DB_API_TOKEN

// stub the two modules sendToSisu loads that would otherwise need a database
const stubModule = (request, exports) => {
  const resolved = require.resolve(request, { paths: [__dirname] })
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports }
}

let updates = []
const ENTRY = {
  id: 'entry-1',
  personId: 'person-1',
  courseUnitRealisationId: 'cur-1',
  assessmentItemId: 'ai-1',
  completionLanguage: 'fi',
  courseUnitId: 'cu-1',
  gradeScaleId: 'sis-0-5',
  gradeId: '3',
  completionDate: '2021-08-09',
  rawEntry: { credits: '5,0' }
}
const model = () => ({
  findAll: async () => [ENTRY],
  // Mirrors sequelize's signature: update(values, { where }). The yield before
  // recording is load-bearing: a real write is not synchronous, and without it a
  // caller that never awaits this still looks correct to the assertions below.
  update: async (values, options) => {
    await new Promise(setImmediate)
    updates.push({ values, options })
  }
})
stubModule('../models/index', { entries: model(), extra_entries: model() })
stubModule('../services/importer', {
  getAcceptorPersons: async () => ({ 'cur-1': [] }),
  getAcceptorPersonsByCourseUnit: async () => ({ 'cu-1': [] })
})

const attainmentsToSisu = require('./sendToSisu')

// a local stand-in for the importer, with per-test behaviour
let respond
let server
let connections
let posts

before(
  () =>
    new Promise((resolve) => {
      server = http.createServer((req, res) => {
        req.on('data', () => {})
        req.on('end', () => {
          posts += 1
          respond(req, res)
        })
      })
      server.on('connection', (socket) => connections.add(socket))
      server.listen(PORT, '127.0.0.1', resolve)
    })
)

after(() => server.close())

beforeEach(() => {
  updates = []
  connections = new Set()
  posts = 0
  respond = (req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end('[]')
  }
})

const request = { user: { id: 1, uid: 'tester', name: 'Tester' }, body: { entryIds: [ENTRY.id] } }
const sentUpdates = () => updates.filter((u) => u.values.sent && u.values.errors === null)

test('records the entry as sent when Sisu accepts it', async () => {
  const [status, body] = await attainmentsToSisu('entries', request)

  assert.equal(posts, 1, 'the importer should have received the attainments')
  assert.equal(status, 200, 'the operator should be told the send succeeded')
  assert.ok(body, 'the success path must return a body like every other path')
  assert.equal(sentUpdates().length, 1, 'Sisu accepted it, so the entry must be recorded as sent')
})

test('reports a failure without crashing when the connection drops after Sisu accepted the POST', async () => {
  respond = (req) => req.socket.destroy()

  // Must not reject: a network error has no `.response` and the axios error is
  // circular, so serialising it whole would throw from inside the catch block.
  const [status, body] = await attainmentsToSisu('entries', request)

  assert.equal(status, 400)
  assert.equal(body.genericError, true)
  assert.match(body.message, /ECONNRESET|socket hang up/, 'the body should say what went wrong')
  assert.equal(sentUpdates().length, 0, 'nothing may be marked sent when the outcome is unknown')
})

/**
 * Nothing else bounds the send: the importer sets no timeout on its own call to Sisu, so a
 * hang there would hold the request until the axios default gives up, long after the caller
 * has stopped listening.
 *
 * The stand-in answers late rather than never, so dropping the timeout fails this on the
 * assertions below instead of leaving a request pending that no `after` hook can clean up --
 * node:test will not run one until the abandoned test settles.
 */
test('gives up on a send that outlives the timeout it was given', async () => {
  respond = (req, res) =>
    setTimeout(() => {
      if (!res.destroyed) res.end('[]')
    }, 200)

  const [status, body] = await attainmentsToSisu('entries', { ...request, timeout: 50 })

  assert.equal(status, 400)
  assert.equal(body.genericError, true)
  assert.equal(sentUpdates().length, 0, 'an abandoned send may not be recorded as sent')
  const attempted = updates.find((u) => u.values.sendState === 'ATTEMPTED')
  assert.ok(attempted, 'it was offered to Sisu, so the entry has to say so')
})

test('writes per-entry errors back when Sisu rejects an attainment', async () => {
  respond = (req, res) => {
    res.writeHead(400, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ failingIds: [ENTRY.id], violations: { [ENTRY.id]: ['bad grade'] } }))
  }

  const [status, body] = await attainmentsToSisu('entries', request)

  assert.equal(status, 400)
  assert.equal(typeof body.message, 'string', 'the caller destructures the body on every path')
  const errorUpdate = updates.find((u) => u.values.errors)
  assert.ok(errorUpdate, 'the violation should be recorded against the entry')
  assert.equal(errorUpdate.options.where.id, ENTRY.id)
})

test('opens a fresh connection per request rather than pooling', async () => {
  // Node 19+ turns on keepAlive for the global agent, which reuses sockets the
  // importer may already have closed. config/httpAgents.js opts back out.
  await attainmentsToSisu('entries', request)
  await attainmentsToSisu('entries', request)

  assert.equal(posts, 2)
  assert.equal(connections.size, 2, 'each POST should use its own connection')
})
