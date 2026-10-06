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

const lapseDateFor = async (
  attainmentDate,
  lapses,
  { enrolmentDateTime, termRegistrations = [], valid = { startDate: '2025-04-20', endDate: '2027-10-01' } } = {}
) =>
  (
    await getDateWithinStudyright(
      [
        {
          id: STUDY_RIGHT_ID,
          personId: PERSON_ID,
          valid,
          lapses,
          grantDate: `${valid.startDate}T00:00:00.000Z`,
          term_registrations: { studyRightId: STUDY_RIGHT_ID, studentId: PERSON_ID, termRegistrations }
        }
      ],
      PERSON_ID,
      { studyRightId: STUDY_RIGHT_ID, enrolmentDateTime },
      moment(attainmentDate)
    )
  ).toISOString()

// The Suotar sends Sisu refused (moved) and accepted (kept), with lapses as importer-db-api reads them
describe('dating an attainment inside a study right lapse', () => {
  test('moves the date to the day of the enrolment that extended the study right', async () => {
    assert.equal(
      await lapseDateFor(
        '2026-08-31T12:43:20.456Z',
        [{ endedOn: '2025-12-31', extendedAt: '2026-09-02T08:00:00.985Z' }],
        {
          enrolmentDateTime: '2026-09-02T07:27:08.445Z'
        }
      ),
      '2026-09-02T00:00:00.000Z'
    )
  })

  test('moves the date to the local day of an enrolment just past midnight', async () => {
    assert.equal(
      await lapseDateFor(
        '2026-09-23T22:20:42.120Z',
        [{ endedOn: '2025-09-01', extendedAt: '2026-09-23T23:00:00.686Z' }],
        {
          enrolmentDateTime: '2026-09-23T22:21:19.749Z'
        }
      ),
      '2026-09-24T00:00:00.000Z'
    )
  })

  test('keeps the date after an enrolment the importer saw only the next day', async () => {
    assert.equal(
      await lapseDateFor(
        '2026-09-21T20:09:00.966Z',
        [{ endedOn: '2026-08-01', extendedAt: '2026-09-21T22:00:00.000Z' }],
        {
          enrolmentDateTime: '2026-09-21T20:03:09.674Z'
        }
      ),
      '2026-09-21T20:09:00.966Z'
    )
  })

  test('keeps the date on the day of the enrolment', async () => {
    assert.equal(
      await lapseDateFor(
        '2026-09-02T05:01:10.426Z',
        [{ endedOn: '2026-09-01', extendedAt: '2026-09-03T06:00:00.000Z' }],
        {
          enrolmentDateTime: '2026-09-02T05:02:50.233Z'
        }
      ),
      '2026-09-02T05:01:10.426Z'
    )
  })

  test('moves the date to the day the importer saw the extension when no enrolment falls in the lapse', async () => {
    assert.equal(
      await lapseDateFor('2026-08-31T12:43:20.456Z', [
        { endedOn: '2025-12-31', extendedAt: '2026-09-02T08:00:00.985Z' }
      ]),
      '2026-09-02T00:00:00.000Z'
    )
  })

  test('keeps the date when the study right has no lapse', async () => {
    assert.equal(await lapseDateFor('2026-09-17T22:14:09.965Z', []), '2026-09-17T22:14:09.965Z')
  })

  test('keeps the date when it is before the lapse began', async () => {
    assert.equal(
      await lapseDateFor('2025-12-20T10:00:00.000Z', [
        { endedOn: '2025-12-31', extendedAt: '2026-09-02T08:00:00.985Z' }
      ]),
      '2025-12-20T10:00:00.000Z'
    )
  })

  test('leaves a study right with term registrations alone', async () => {
    assert.equal(
      await lapseDateFor(
        '2026-08-31T12:43:20.456Z',
        [{ endedOn: '2025-12-31', extendedAt: '2026-09-02T08:00:00.985Z' }],
        {
          termRegistrations: [autumn2026('ATTENDING', '2026-05-18')]
        }
      ),
      '2026-08-31T12:43:20.456Z'
    )
  })

  test('moves the date out of an earlier lapse of the same study right', async () => {
    const lapses = [
      { endedOn: '2024-12-31', extendedAt: '2025-02-10T09:00:00.000Z' },
      { endedOn: '2025-12-31', extendedAt: '2026-09-02T08:00:00.000Z' }
    ]
    assert.equal(
      await lapseDateFor('2025-01-20T10:00:00.000Z', lapses, {
        valid: { startDate: '2024-01-01', endDate: '2027-10-01' }
      }),
      '2025-02-10T00:00:00.000Z'
    )
  })

  test('moves the date on a study right that was extended to open-ended', async () => {
    assert.equal(
      await lapseDateFor(
        '2026-08-31T12:43:20.456Z',
        [{ endedOn: '2025-12-31', extendedAt: '2026-09-02T08:00:00.985Z' }],
        {
          valid: { startDate: '2025-04-20' }
        }
      ),
      '2026-09-02T00:00:00.000Z'
    )
  })
})
