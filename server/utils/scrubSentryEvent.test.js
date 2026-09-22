const { test, describe } = require('node:test')
const assert = require('node:assert')

const { scrubSentryEvent, REDACTED } = require('./scrubSentryEvent')

const eventWith = (request) => scrubSentryEvent({ request })

describe('scrubbing a Sentry event', () => {
  test('redacts the credential the mooc.fi API is called with', () => {
    const { request } = eventWith({
      headers: { authorization: 'Bearer suotar_realkey', token: 'suotar_realkey', 'content-type': 'application/json' }
    })

    assert.equal(request.headers.authorization, REDACTED)
    assert.equal(request.headers.token, REDACTED)
    assert.equal(request.headers['content-type'], 'application/json', 'the rest is what makes an event useful')
  })

  test('redacts a header named something nobody thought of', () => {
    const { request } = eventWith({ headers: { 'x-api-key': 'secret', cookie: 'session=1', 'user-agent': 'axios' } })

    assert.equal(request.headers['x-api-key'], REDACTED)
    assert.equal(request.headers.cookie, REDACTED)
    assert.equal(request.headers['user-agent'], 'axios')
  })

  test('matches a header whatever its case', () => {
    const { request } = eventWith({ headers: { Authorization: 'Bearer suotar_realkey' } })

    assert.equal(request.headers.Authorization, REDACTED)
  })

  test('redacts the token checkToken reads from the query string', () => {
    const { request } = eventWith({ query_string: 'token=supersecret&course=TKT10002' })

    assert.equal(request.query_string, `token=${REDACTED}&course=TKT10002`)
  })

  test('leaves an event with no request alone', () => {
    assert.doesNotThrow(() => scrubSentryEvent({}))
    assert.doesNotThrow(() => scrubSentryEvent({ request: {} }))
  })
})
