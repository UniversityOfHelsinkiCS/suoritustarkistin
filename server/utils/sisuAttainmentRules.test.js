// Enrolment days are read in local time, as in the Helsinki-pinned images
process.env.TZ = 'Europe/Helsinki'

const { test, describe } = require('node:test')
const assert = require('node:assert')
const moment = require('moment')

require('../test/helpers')

const { getDateWithinStudyright } = require('./sisuAttainmentRules')

const PERSON_ID = 'hy-hlo-1'
const STUDY_RIGHT_ID = 'otm-study-right'

// As importer-db-api's study-rights-by-person serialises it
const studyRight = (termRegistrations) => ({
  id: STUDY_RIGHT_ID,
  personId: PERSON_ID,
  valid: { startDate: '2024-08-01', endDate: '2031-08-01' },
  grantDate: '2024-08-08T00:00:00.000Z',
  term_registrations: { studyRightId: STUDY_RIGHT_ID, studentId: PERSON_ID, termRegistrations }
})

const autumn2026 = (termRegistrationType, registrationDate) => ({
  studyTerm: { studyYearStartYear: 2026, termIndex: 0 },
  termRegistrationType,
  registrationDate,
  statutoryAbsence: false
})

const dateFor = async (termRegistrations, attainmentDate) =>
  (
    await getDateWithinStudyright(
      [studyRight(termRegistrations)],
      PERSON_ID,
      { studyRightId: STUDY_RIGHT_ID },
      moment(attainmentDate)
    )
  ).toISOString()

describe('dating an attainment against the term registration of the enrolment study right', () => {
  test('moves the date to a registration made after the attainment', async () => {
    assert.equal(
      await dateFor([autumn2026('ATTENDING', '2026-09-25')], '2026-09-17T04:24:42.252Z'),
      '2026-09-25T00:00:00.000Z'
    )
  })

  test('uses the attending registration when the term also has another one', async () => {
    assert.equal(
      await dateFor(
        [autumn2026('NONATTENDING', '2026-08-23'), autumn2026('ATTENDING', '2026-09-25')],
        '2026-09-17T04:24:42.252Z'
      ),
      '2026-09-25T00:00:00.000Z'
    )
  })

  test('keeps the date when the student had registered before the attainment', async () => {
    assert.equal(
      await dateFor([autumn2026('ATTENDING', '2026-05-18')], '2026-09-11T06:42:43.298Z'),
      '2026-09-11T06:42:43.298Z'
    )
  })

  test('keeps the date when the registration is not attending, since no date would do', async () => {
    assert.equal(
      await dateFor([autumn2026('NONATTENDING', '2026-08-23')], '2026-09-06T14:48:03.444Z'),
      '2026-09-06T14:48:03.444Z'
    )
  })

  test('keeps the date when the registration falls in a later term than the attainment', async () => {
    const spring2026 = {
      ...autumn2026('ATTENDING', '2026-08-05'),
      studyTerm: { studyYearStartYear: 2025, termIndex: 1 }
    }
    assert.equal(await dateFor([spring2026], '2026-07-20T10:00:00.000Z'), '2026-07-20T10:00:00.000Z')
  })

  test('keeps the date when the study right has no term registrations, as open university ones do', async () => {
    assert.equal(await dateFor([], '2026-08-31T12:43:20.456Z'), '2026-08-31T12:43:20.456Z')
  })
})
