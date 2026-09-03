const { v4: uuidv4 } = require('uuid')
const { fakerFI: faker } = require('@faker-js/faker')
const { getBatchId } = require('../../utils/common')
const db = require('../index')

function rand(min, max) {
  return Math.round(Math.random() * (max - min) + min)
}

// Sisu-shaped identifiers. Locale comes from the fakerFI instance above, so there is
// no locale to set here.
const sisu = {
  person: () => `hy-hlo-${rand(100000, 999999)}`,
  courseUnitRealisation: () => `otm-${faker.string.uuid()}`,
  assessmentItem: () => `hy-${rand(100000, 999999)}-default-teaching-participation`,
  courseUnit: () => `hy-CU-${rand(100000, 999999)}-2021-08-01`,
  studyRight: () => `hy-opinoik-${rand(100000, 999999)}`,
  id: () => `hy-kur-${uuidv4()}`
}

const rawEntryFactory = async (courseCode, graderName, options) => {
  const grader = await db.users.findOne({
    where: { name: graderName },
    raw: true
  })

  const course = await db.courses.findOne({
    where: { courseCode },
    returning: true,
    raw: true
  })

  return await db.raw_entries.create(
    {
      studentNumber: `014${rand(100000, 999999)}`,
      batchId: getBatchId(courseCode),
      grade: rand(1, 6),
      credits: course.credits,
      language: course.language,
      attainmentDate: new Date(),
      courseId: course.id,
      graderId: grader.id,
      reporterId: grader.id,
      ...options
    },
    { returning: true, raw: true }
  )
}

const entryFactory = async (courseCode, graderName, options) => {
  const rawEntry = await rawEntryFactory(courseCode, graderName, options ? options.rawEntry : {})
  const entryOptions = options ? options.entry : {}
  await db.entries.create({
    id: sisu.id(),
    personId: sisu.person(),
    verifierPersonId: sisu.person(),
    courseUnitRealisationId: sisu.courseUnitRealisation(),
    courseUnitRealisationName: { fi: faker.person.jobTitle() },
    assessmentItemId: sisu.assessmentItem(),
    completionDate: new Date(),
    sent: new Date(),
    sendState: 'ACCEPTED',
    completionLanguage: 'fi',
    courseUnitId: sisu.courseUnit(),
    gradeScaleId: 'sis-0-5',
    gradeId: rawEntry.grade,
    rawEntryId: rawEntry.id,
    ...entryOptions
  })

  return await db.raw_entries.findOne({
    where: { id: rawEntry.id },
    include: [
      { model: db.entries, as: 'entry', include: ['sender'] },
      { model: db.users, as: 'reporter' },
      { model: db.users, as: 'grader' },
      { model: db.courses, as: 'course' }
    ],
    raw: true
  })
}

const extraEntryFactory = async (courseCode, graderName, options) => {
  const rawEntry = await rawEntryFactory(courseCode, graderName, options ? options.rawEntry : {})
  const entryOptions = options ? options.entry : {}
  await db.extra_entries.create({
    id: sisu.id(),
    personId: sisu.person(),
    studyRightId: sisu.studyRight(),
    verifierPersonId: sisu.person(),
    completionDate: new Date(),
    completionLanguage: 'fi',
    courseUnitId: sisu.courseUnit(),
    gradeScaleId: 'sis-hyl-hyv',
    gradeId: '1',
    rawEntryId: rawEntry.id,
    ...entryOptions
  })

  return await db.raw_entries.findOne({
    where: { id: rawEntry.id },
    include: [
      { model: db.extra_entries, as: 'extraEntry', include: ['sender'] },
      { model: db.users, as: 'reporter' },
      { model: db.users, as: 'grader' },
      { model: db.courses, as: 'course' }
    ],
    raw: true
  })
}

const bscThesisEntryFactory = async (graderName) => {
  const studentNumber = `014${rand(100000, 999999)}`
  const batchId = getBatchId('TKT20013')

  await entryFactory('TKT20013', graderName, { rawEntry: { studentNumber, batchId } })
  const extraCodes = ['TKT50001', 'TKT20014', 'TKT50002']
  await Promise.all(
    extraCodes.map(
      async (courseCode) => await extraEntryFactory(courseCode, graderName, { rawEntry: { studentNumber, batchId } })
    )
  )
}

module.exports = { entryFactory, extraEntryFactory, bscThesisEntryFactory }
