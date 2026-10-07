const { test, describe } = require('node:test')
const assert = require('node:assert')

const { resolveStudyRight } = require('./resolveStudyRight')

const studyRight = (overrides = {}) => ({
  id: 'otm-sr-1',
  valid: { startDate: '2026-08-01', endDate: '2027-07-31' },
  grantDate: '2026-08-01T00:00:00.000Z',
  term_registrations: { termRegistrations: [] },
  ...overrides
})

describe('resolving the study right for an attainment', () => {
  test('takes an open university study right created in Sisu, which has no term registrations', () => {
    const open = studyRight({ organisation: { code: 'H930' } })
    assert.equal(resolveStudyRight([open], '2026-10-06').id, 'otm-sr-1')
  })

  test('skips a degree study right without a term registration for the attainment term', () => {
    const degree = studyRight({ organisation: { code: 'H50' } })
    assert.deepEqual(resolveStudyRight([degree], '2026-10-06'), {})
  })
})
