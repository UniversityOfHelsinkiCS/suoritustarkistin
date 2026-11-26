/**
 * Erilliskirjaus grades: the grade given on the row is what goes to Sisu, on the course's
 * grade scale, and a failing grade is refused rather than registered.
 */
const { test, before, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')

const {
  connectDatabase,
  disconnectDatabase,
  truncateDatabase,
  importer,
  startImporter,
  stopImporter
} = require('../test/helpers')

const db = require('@server/models')
const fixtures = require('../../e2e-importer/data.json')
const processExtraEntries = require('./processExtraEntries')

const STUDENT = fixtures.students.find(({ studentNumber }) => studentNumber === '015448314')
const EMPLOYEE = fixtures.employees.find(({ employeeNumber }) => employeeNumber === '9111111')

const courseUnit = (code, extra = {}) => [
  { id: `cu-${code}`, code, validityPeriod: { startDate: '2020-08-01' }, ...extra }
]

const answerImporter = (courseUnits) =>
  importer.respondByPath({
    '/students': [STUDENT],
    '/employees': [EMPLOYEE],
    '/suotar/attainments': [],
    '/suotar/study-rights-by-person': fixtures.studyRightsByPeron.filter(({ personId }) => personId === STUDENT.id),
    '/suotar/course-unit-ids': courseUnits,
    '/grades': fixtures.grades
  })

let grader

before(async () => {
  await connectDatabase()
  await startImporter()
})
after(async () => {
  await stopImporter()
  await disconnectDatabase()
})
beforeEach(async () => {
  await truncateDatabase()
  importer.reset()
  grader = await db.users.create({ name: 'grader', uid: 'grader', employeeId: '9111111', isGrader: true })
})

const run = async ({ gradeScale, grade, courseUnitGradeScale }) => {
  const course = await db.courses.create({
    name: 'KOPA',
    courseCode: 'TKT90001',
    language: 'fi',
    credits: '5,0',
    gradeScale,
    isKopa: true
  })
  answerImporter({
    TKT90001: courseUnit('TKT90001', courseUnitGradeScale ? { gradeScaleId: courseUnitGradeScale } : {})
  })
  const rawEntry = await db.raw_entries.create({
    studentNumber: STUDENT.studentNumber,
    batchId: 'TKT90001-extra',
    grade,
    credits: '5,0',
    language: 'fi',
    attainmentDate: new Date('2022-01-15'),
    courseId: course.id,
    graderId: grader.id
  })
  const [failed, success] = await processExtraEntries([rawEntry], false)
  return { failed, success }
}

describe('a passing grade', () => {
  test('is sent on the 0-5 scale of the course', async () => {
    const { failed, success } = await run({ gradeScale: 'sis-0-5', grade: '4' })

    assert.deepEqual(failed, [])
    assert.equal(success[0].gradeScaleId, 'sis-0-5')
    assert.equal(success[0].gradeId, '4')
  })

  test('is sent as Hyv. on a pass/fail course', async () => {
    const { failed, success } = await run({ gradeScale: 'sis-hyl-hyv', grade: 'Hyv.' })

    assert.deepEqual(failed, [])
    assert.equal(success[0].gradeScaleId, 'sis-hyl-hyv')
    assert.equal(success[0].gradeId, '1')
  })

  test('keeps the pass/fail scale when the course has none', async () => {
    const { success } = await run({ gradeScale: null, grade: 'Hyv.' })

    assert.equal(success[0].gradeScaleId, 'sis-hyl-hyv')
  })

  test("follows Sisu's scale for the course unit over Suotar's", async () => {
    const { success } = await run({ gradeScale: 'sis-hyl-hyv', grade: '2', courseUnitGradeScale: 'sis-0-5' })

    assert.equal(success[0].gradeScaleId, 'sis-0-5')
    assert.equal(success[0].gradeId, '2')
  })
})

describe('a grade that cannot be registered', () => {
  for (const [gradeScale, grade] of [
    ['sis-0-5', '0'],
    ['sis-0-5', 'Hyl.'],
    ['sis-hyl-hyv', 'Hyl.']
  ]) {
    test(`fails for the failing grade ${grade} on ${gradeScale}`, async () => {
      const { failed, success } = await run({ gradeScale, grade })

      assert.deepEqual(success, [])
      assert.match(failed[0].message, /Failing grade/)
    })
  }

  test('fails for a grade not on the scale of the course', async () => {
    const { failed, success } = await run({ gradeScale: 'sis-hyl-hyv', grade: '3' })

    assert.deepEqual(success, [])
    assert.match(failed[0].message, /Invalid grade "3".*Available grades are: Hyv\./)
  })
})
