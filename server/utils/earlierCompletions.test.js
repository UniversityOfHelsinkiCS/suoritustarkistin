const { test, describe, afterEach } = require('node:test')
const assert = require('node:assert')

const { identicalCompletionFound, isImprovedGrade } = require('./earlierCompletions')

const STUDENT_NUMBER = '012345678'
const CODE = 'TKT10001'

// As the importer serialises it: the date is a timestamp, not a bare day.
const attainment = (overrides = {}) => ({
  attainmentDate: '2026-05-22T00:00:00.000Z',
  credits: 5,
  misregistration: false,
  grade: { passed: true, numericCorrespondence: 3, name: { en: '3' }, localId: '3' },
  ...overrides
})

const earlier = (attainments) => [{ studentNumber: STUDENT_NUMBER, courseCode: CODE, attainments }]

const isIdentical = (attainments, { grade = '3', date = '2026-05-22', credits = '5' } = {}) =>
  identicalCompletionFound(earlier(attainments), STUDENT_NUMBER, CODE, grade, date, credits)

const originalTz = process.env.TZ

afterEach(() => {
  if (originalTz === undefined) delete process.env.TZ
  else process.env.TZ = originalTz
})

describe('identicalCompletionFound', () => {
  test('finds a completion identical in grade, credits and day', () => {
    assert.equal(isIdentical([attainment()]), true)
  })

  // CI runs UTC, the production image pins Europe/Helsinki.
  test('gives the same answer under UTC and Europe/Helsinki', () => {
    const answers = ['UTC', 'Europe/Helsinki'].map((tz) => {
      process.env.TZ = tz
      return [tz, isIdentical([attainment()])]
    })

    assert.deepEqual(answers, [
      ['UTC', true],
      ['Europe/Helsinki', true]
    ])
  })

  test('matches a date given as a timestamp on the same day', () => {
    assert.equal(isIdentical([attainment()], { date: '2026-05-22T12:00:00.000Z' }), true)
  })

  test('does not match a different day', () => {
    assert.equal(isIdentical([attainment()], { date: '2026-05-23' }), false)
  })

  test('does not match a different grade', () => {
    assert.equal(isIdentical([attainment()], { grade: '4' }), false)
  })

  test('does not match different credits', () => {
    assert.equal(isIdentical([attainment()], { credits: '10' }), false)
  })

  test('matches credits written with a comma', () => {
    assert.equal(isIdentical([attainment({ credits: 5.5 })], { credits: '5,5' }), true)
  })

  test('matches credits the importer sent as a string', () => {
    assert.equal(isIdentical([attainment({ credits: '5' })]), true)
  })

  test('ignores a misregistered attainment', () => {
    assert.equal(isIdentical([attainment({ misregistration: true })]), false)
  })

  test('is false when the student has no earlier attainments', () => {
    assert.equal(isIdentical([]), false)
  })

  test('is false for another course code', () => {
    assert.equal(
      identicalCompletionFound(earlier([attainment()]), STUDENT_NUMBER, 'OTHER', '3', '2026-05-22', '5'),
      false
    )
  })

  test('matches a pass on a pass/fail scale', () => {
    const pass = attainment({ grade: { passed: true, numericCorrespondence: null, name: { en: 'Pass' } } })
    assert.equal(isIdentical([pass], { grade: 'Hyv.' }), true)
  })
})

describe('isImprovedGrade', () => {
  const improves = (attainments, { grade = '4', date = '2026-05-22', credits = '5' } = {}) =>
    isImprovedGrade(earlier(attainments), STUDENT_NUMBER, grade, date, credits)

  test('a better numeric grade improves', () => {
    assert.equal(improves([attainment()]), true)
  })

  test('a worse numeric grade does not', () => {
    assert.equal(improves([attainment()], { grade: '2' }), false)
  })

  test('every earlier attainment has to be beaten, not just the latest', () => {
    const better = attainment({
      attainmentDate: '2026-01-01T00:00:00.000Z',
      grade: { passed: true, numericCorrespondence: 5, name: { en: '5' } }
    })
    assert.equal(improves([attainment(), better]), false)
  })

  test('no earlier attainments improves', () => {
    assert.equal(improves([]), true)
  })
})
