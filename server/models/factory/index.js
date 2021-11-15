
const { getBatchId } = require('../../utils/common')
const db = require('../index')
const { v4: uuidv4 } = require('uuid')

function rand(min, max) {
  return Math.round(Math.random() * (max - min) + min)
}

const faker = require('faker')
faker.locale = 'fi'

faker.sisu = {}
faker.sisu.person = () => `hy-hlo-${rand(100000, 999999)}`
faker.sisu.courseUnitRealisation = () => `otm-${faker.datatype.uuid()}`
faker.sisu.assessmentItem = () => `hy-${rand(100000, 999999)}-default-teaching-participation`
faker.sisu.courseUnit = () => `hy-CU-${rand(100000, 999999)}-2021-08-01`
faker.sisu.studyRight = () => `hy-opinoik-${rand(100000, 999999)}`
faker.sisu.id = () => `hy-kur-${uuidv4()}`


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

  return await db.raw_entries.create({
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
  }, { returning: true, raw: true })
}

const entryFactory = async (courseCode, graderName, options) => {
  const rawEntry = await rawEntryFactory(courseCode, graderName, options ? options.rawEntry : {})
  const entryOptions = options ? options.entry : {}
  await db.entries.create({
    id: faker.sisu.id(),
    personId: faker.sisu.person(),
    verifierPersonId: faker.sisu.person(),
    courseUnitRealisationId: faker.sisu.courseUnitRealisation(),
    courseUnitRealisationName: { fi: faker.name.jobTitle() },
    assessmentItemId: faker.sisu.assessmentItem(),
    completionDate: new Date(),
    completionLanguage: 'fi',
    courseUnitId: faker.sisu.courseUnit(),
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
    id: faker.sisu.id(),
    personId: faker.sisu.person(),
    studyRightId: faker.sisu.studyRight(),
    verifierPersonId: faker.sisu.person(),
    completionDate: new Date(),
    completionLanguage: 'fi',
    courseUnitId: faker.sisu.courseUnit(),
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
  await Promise.all(extraCodes.map(async (courseCode) => await extraEntryFactory(courseCode, graderName, { rawEntry: { studentNumber, batchId } })))
}

module.exports = { entryFactory, extraEntryFactory, bscThesisEntryFactory }