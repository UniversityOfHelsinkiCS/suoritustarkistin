/* eslint-disable no-console, no-unused-vars, prefer-const */
const moment = require('moment')
const db = require('../models/index')
const { getStudyRight, getEnrolments } = require('../services/importer')
const { filterEnrolments } = require('./processEntries')

/**
 * A (simple) script to automatically fix attainment date for single entry, based
 * on the validity period of study right.
 *
 * Usage:
 *  1. Go inside production container
 *  2. npm run cli -- batchId personId courseCode
 *  3. *magic happens* (∩ ͡° ͜ʖ ͡°)⊃━☆ﾟ. *
 *  4. Enjoy
 */
const fixAttainmentDate = async () => {
  let [, , batchId, personId, courseCode, dryRun = true] = process.argv
  if (typeof dryRun === 'string' || dryRun instanceof String) dryRun = false
  const rawEntry = await db.raw_entries.findOne({
    where: {
      batchId,
      '$entry.personId$': personId,
      '$course.courseCode$': courseCode
    },
    raw: true,
    include: [
      { model: db.entries, as: 'entry', include: ['sender'] },
      { model: db.courses, as: 'course' }
    ]
  })
  if (!rawEntry) return console.error('Attainment not found')

  const originalAttainmentDate = moment(rawEntry.attainmentDate)

  console.log(`Original attainment date is ${JSON.stringify(originalAttainmentDate)}`)

  const enrolments = await getEnrolments([{ personId, code: courseCode }])
  const filteredEnrolment = filterEnrolments(originalAttainmentDate, enrolments[0])
  if (!filteredEnrolment) return console.error('No enrollments found', rawEntry.attainmentDate)

  const { studyRightId } = filteredEnrolment
  const studyRight = await getStudyRight(studyRightId)
  const { valid } = studyRight

  console.log(`Study right valid dates: ${JSON.stringify(valid)}`)

  const studyRightStart = moment(valid.startDate)
  const studyRightEnd = moment(valid.endDate)

  if (originalAttainmentDate.isBetween(studyRightStart, studyRightEnd))
    return console.log('Attainment date is between study right valid dates')

  let newAttainmentDate
  if (originalAttainmentDate.isBefore(studyRightStart)) {
    console.log('Current attainment date is before start of study right')
    newAttainmentDate = studyRightStart
  } else if (originalAttainmentDate.isSameOrAfter(studyRightEnd)) {
    console.log('Current attainment date is same or after end of study right')
    newAttainmentDate = studyRightEnd.subtract(1, 'day')
  }

  console.info(`New attainment date based on study right is ${newAttainmentDate}`)

  if (dryRun) return console.log('Dry run, exiting now')
  if (!newAttainmentDate) return console.error('No new attainment date could be found')

  const [rows, status1] = await db.raw_entries.update(
    {
      attainmentDate: newAttainmentDate
    },
    {
      where: {
        id: rawEntry.id
      },
      returning: true
    }
  )
  const [rows2, status2] = await db.entries.update(
    {
      completionDate: newAttainmentDate
    },
    {
      where: {
        rawEntryId: rawEntry.id
      },
      returning: true
    }
  )

  const entryStatus = JSON.stringify(status1)
  const rawEntryStatus = JSON.stringify(status2)

  console.log('')
  console.log('SUCCESS!')
  console.log('---- Changed entries ----- ')
  console.log('New status of raw entry update:')
  console.log(rawEntryStatus)
  console.log('')
  console.log('New status of entry update')
  console.log(entryStatus)
  console.log('--------------------------')
}

fixAttainmentDate()
