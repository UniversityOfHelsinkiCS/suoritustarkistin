const { test, afterEach, beforeEach, describe, mock } = require('node:test')
const assert = require('node:assert')

require('../test/helpers')

const logger = require('@server/utils/logger')
const { moocfiLogger, endpointLabel, ENDPOINTS } = require('./moocfiLogger')

const emitted = (level) => logger[level].mock.calls[0].arguments[0]

describe('moocfiLogger', () => {
  beforeEach(() => {
    for (const level of ['info', 'warn', 'error']) mock.method(logger, level, () => {})
  })

  afterEach(() => mock.restoreAll())

  test('names the api and endpoint on the line so a filter can select them', () => {
    moocfiLogger('/attainments/import').info('sent', { amount: 3 })

    const line = emitted('info')
    assert.strictEqual(line.api, 'moocfi')
    assert.strictEqual(line.endpoint, '/attainments/import')
    assert.strictEqual(line.message, 'sent')
    assert.strictEqual(line.amount, 3)
  })

  test('emits no labels at all', () => {
    const log = moocfiLogger('/enrolments/resolve')
    log.info('resolved')

    const line = emitted('info')
    assert.strictEqual(line.requestId, log.requestId)
    // winston-loki turns `labels` into Loki stream labels, and this deployment indexes only
    // app, environment and level. requestId especially would be one stream per request.
    assert.ok(!('labels' in line), 'a labels key here silently adds indexed streams')
  })

  test('gives every line of one request the same requestId, and different requests different ones', () => {
    const log = moocfiLogger('/attainments/verify')
    log.info('first')
    log.info('second')

    assert.strictEqual(logger.info.mock.calls[0].arguments[0].requestId, log.requestId)
    assert.strictEqual(logger.info.mock.calls[1].arguments[0].requestId, log.requestId)
    assert.notStrictEqual(moocfiLogger('/attainments/verify').requestId, log.requestId)
  })

  test('resolves the endpoint the same way for both callers', () => {
    // A handler sees the path relative to /api; the auth guard, mounted on a path prefix,
    // sees the original url. The label has to come out the same either way.
    assert.strictEqual(endpointLabel('/enrolments/resolve'), '/enrolments/resolve')
    assert.strictEqual(endpointLabel('/api/moocfi/enrolments/resolve'), '/enrolments/resolve')
    assert.strictEqual(endpointLabel('/api/moocfi/enrolments/resolve?retry=1'), '/enrolments/resolve')
    // Express routes a trailing slash to the same handler, so the label has to survive one.
    assert.strictEqual(endpointLabel('/api/moocfi/enrolments/resolve/'), '/enrolments/resolve')
    assert.strictEqual(endpointLabel('/api/moocfi/enrolments/resolve/?retry=1'), '/enrolments/resolve')
  })

  test('caps the endpoint at the known ones, whatever it is handed', () => {
    // The guard runs before routing, so an unrouted path reaches it. Passing the path through
    // would put whatever a scanner tries in the field a dashboard filters on.
    assert.strictEqual(endpointLabel('/api/moocfi/persons/whatever-was-asked-for'), 'other')
    assert.strictEqual(endpointLabel(''), 'other')
    assert.strictEqual(endpointLabel(undefined), 'other')

    moocfiLogger('/api/moocfi/persons/nope').info('unrouted')
    assert.strictEqual(emitted('info').endpoint, 'other')
  })

  test('every known endpoint resolves to itself from both callers', () => {
    for (const endpoint of ENDPOINTS) {
      assert.strictEqual(endpointLabel(endpoint), endpoint)
      assert.strictEqual(endpointLabel(`/api${endpoint}`), endpoint)
      assert.strictEqual(endpointLabel(`/api${endpoint}/`), endpoint)
    }
  })

  test('routes each level to the matching winston method', () => {
    const log = moocfiLogger('/persons/resolve-by-student-numbers')
    log.warn('a warning')
    log.error('an error')

    assert.strictEqual(logger.info.mock.callCount(), 0)
    assert.strictEqual(emitted('warn').message, 'a warning')
    assert.strictEqual(emitted('error').message, 'an error')
  })
})
