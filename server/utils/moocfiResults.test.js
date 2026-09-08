/**
 * The result vocabulary itself, which the endpoint suites exercise only through whichever
 * codes they happen to reach.
 *
 * The invariant worth guarding: a code and its wording travel together. An endpoint asks for
 * a code and gets the agreed message, or the module refuses to build the item at all.
 */
const { test, describe } = require('node:test')
const assert = require('node:assert')

require('module-alias/register')

const {
  CODES,
  REQUEST_CODES,
  MESSAGES,
  okItem,
  errorItem,
  ServiceUnavailableError,
  serviceUnavailable
} = require('./moocfiResults')

describe('the result codes', () => {
  test('name themselves, so a call site cannot ask for a code that does not exist', () => {
    for (const [name, code] of Object.entries({ ...CODES, ...REQUEST_CODES })) {
      assert.equal(name, code)
    }
  })

  test('are the only things MESSAGES has wording for', () => {
    const known = new Set([...Object.values(CODES), ...Object.values(REQUEST_CODES)])
    for (const code of Object.keys(MESSAGES)) {
      assert.ok(known.has(code), `MESSAGES has wording for unknown code ${code}`)
    }
  })
})

describe('errorItem', () => {
  test("takes the code's own wording when the call site gives none", () => {
    assert.deepEqual(errorItem('item-1', CODES.personNotFound), {
      requestItemId: 'item-1',
      status: 'error',
      code: 'personNotFound',
      error: { message: MESSAGES[CODES.personNotFound] }
    })
  })

  test('lets a code whose message names the item pass its own', () => {
    const item = errorItem('item-1', CODES.invalidCredits, { message: 'Credits must be between 1 and 5.' })
    assert.equal(item.error.message, 'Credits must be between 1 and 5.')
  })

  test('carries a result for the codes that report an error and still name the submission', () => {
    const item = errorItem('item-1', CODES.sisuTimeout, { result: { submittedAttainmentId: 'hy-kur-1' } })
    assert.deepEqual(item.result, { submittedAttainmentId: 'hy-kur-1' })
  })

  test('leaves result off entirely when there is none, rather than sending a null', () => {
    assert.ok(!('result' in errorItem('item-1', CODES.notRegistered)))
  })

  // A code with no wording is a mistake in this module, not an outcome to answer with:
  // mooc.fi would get `message: undefined` and nothing to act on.
  test('refuses a code it has no wording for', () => {
    assert.throws(() => errorItem('item-1', CODES.invalidCredits), /No message for result code invalidCredits/)
    assert.throws(() => errorItem('item-1', 'notACode'), /No message for result code notACode/)
  })
})

test('serviceUnavailable builds an error to throw, not an item to answer', () => {
  const error = serviceUnavailable('Resolving persons failed', new Error('importer is on fire'), { items: 2 })

  assert.ok(error instanceof ServiceUnavailableError)
  assert.equal(error.message, 'Failed to fetch Sisu data.')
})

test('okItem carries the result the spec names for the code', () => {
  assert.deepEqual(okItem('item-1', CODES.personFound, { personId: 'person-1' }), {
    requestItemId: 'item-1',
    status: 'ok',
    code: 'personFound',
    result: { personId: 'person-1' }
  })
})
