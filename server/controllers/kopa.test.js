/**
 * KOPA users: they may report any KOPA course on top of their own, and pick any grader
 * of a KOPA course. Users without the KOPA role see none of that.
 */
const { test, before, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')

const {
  connectDatabase,
  disconnectDatabase,
  truncateDatabase,
  startFullApp,
  stopApp,
  request
} = require('../test/helpers')

const db = require('@server/models')

const headersFor = ({ employeeId, uid }) => ({ employeenumber: employeeId, uid, givenname: uid, sn: uid })

const course = (courseCode, extra = {}) => ({
  name: courseCode,
  courseCode,
  language: 'fi',
  credits: '5,0',
  gradeScale: 'sis-0-5',
  ...extra
})

let kopa
let grader
let kopaGrader
let outsider

before(async () => {
  await connectDatabase()
  await startFullApp()
})
after(async () => {
  await stopApp()
  await disconnectDatabase()
})
beforeEach(async () => {
  await truncateDatabase()
  kopa = await db.users.create({ name: 'kopa', uid: 'kopa', employeeId: '7001', isKopa: true })
  grader = await db.users.create({ name: 'grader', uid: 'grader', employeeId: '7002', isGrader: true })
  kopaGrader = await db.users.create({ name: 'kopagrader', uid: 'kopagrader', employeeId: '7003', isGrader: true })
  outsider = await db.users.create({ name: 'outsider', uid: 'outsider', employeeId: '7004', isGrader: true })

  const kopaCourse = await db.courses.create(course('TKT90001', { isKopa: true }))
  const otherKopaCourse = await db.courses.create(course('TKT90002', { isKopa: true }))
  const ownCourse = await db.courses.create(course('TKT90003'))
  await db.courses.create(course('TKT90004'))

  await kopaGrader.addCourse(kopaCourse)
  await kopaGrader.addCourse(otherKopaCourse)
  await kopa.addCourse(ownCourse)
  await grader.addCourse(ownCourse)
  await outsider.addCourse(await db.courses.findOne({ where: { courseCode: 'TKT90004' } }))
})

const courseCodes = (body) => body.map(({ courseCode }) => courseCode).sort()

describe('courses of a KOPA user', () => {
  test('are their own courses and every KOPA course, each with its graders', async () => {
    const { status, body } = await request('GET', `/api/users/${kopa.id}/courses`, { headers: headersFor(kopa) })

    assert.equal(status, 200)
    assert.deepEqual(courseCodes(body), ['TKT90001', 'TKT90002', 'TKT90003'])
    const kopaCourse = body.find(({ courseCode }) => courseCode === 'TKT90001')
    assert.equal(kopaCourse.isKopa, true)
    assert.deepEqual(
      kopaCourse.graders.map(({ uid }) => uid),
      ['kopagrader']
    )
  })

  test('a grader without the KOPA role still sees only their own courses', async () => {
    const { body } = await request('GET', `/api/users/${grader.id}/courses`, { headers: headersFor(grader) })

    assert.deepEqual(courseCodes(body), ['TKT90003'])
  })
})

describe('graders of a KOPA user', () => {
  test('are the graders of KOPA courses, listed once', async () => {
    const { status, body } = await request('GET', `/api/users/${kopa.id}/graders`, { headers: headersFor(kopa) })

    assert.equal(status, 200)
    assert.deepEqual(
      body.map(({ uid }) => uid),
      ['kopagrader']
    )
  })

  test('a plain grader gets only themselves', async () => {
    const { body } = await request('GET', `/api/users/${grader.id}/graders`, { headers: headersFor(grader) })

    assert.deepEqual(
      body.map(({ uid }) => uid),
      ['grader']
    )
  })
})

test('a KOPA user without the grader role may use the reporting routes', async () => {
  const { status } = await request('GET', '/api/sis_reports', { headers: headersFor(kopa) })

  assert.equal(status, 200)
})

describe('choosing the grader of a report', () => {
  const report = async (user, grader, courseCode, rowCourse = '') => {
    const { id: courseId } = await db.courses.findOne({ where: { courseCode } })
    return request('POST', '/api/sis_raw_entries', {
      headers: headersFor(user),
      body: {
        courseId,
        graderId: grader.employeeId,
        date: new Date(),
        data: [{ studentId: '011000002', grade: '3', course: rowCourse }]
      }
    })
  }

  // Past the grader check the report goes on to the importer, so any status but 403 is a pass
  test('a KOPA user may name a grader of the KOPA course', async () => {
    const { status } = await report(kopa, kopaGrader, 'TKT90001')
    assert.notEqual(status, 403)
  })

  test('a KOPA user may not name that grader on a course that is not KOPA', async () => {
    const { status } = await report(kopa, kopaGrader, 'TKT90003')
    assert.equal(status, 403)
  })

  test('nor smuggle a non-KOPA course in on a row', async () => {
    const { status } = await report(kopa, kopaGrader, 'TKT90001', 'TKT90004')
    assert.equal(status, 403)
  })

  test('a KOPA user may not name a grader who does not grade KOPA courses', async () => {
    const { status } = await report(kopa, outsider, 'TKT90001')
    assert.equal(status, 403)
  })

  test('a plain grader may name only themselves', async () => {
    assert.equal((await report(grader, kopaGrader, 'TKT90003')).status, 403)
    assert.notEqual((await report(grader, grader, 'TKT90003')).status, 403)
  })
})

describe('a report a KOPA user made for another grader', () => {
  let batchId

  beforeEach(async () => {
    const { id: courseId } = await db.courses.findOne({ where: { courseCode: 'TKT90001' } })
    batchId = 'TKT90001-kopa'
    const rawEntry = await db.raw_entries.create({
      studentNumber: '011000002',
      batchId,
      grade: '3',
      credits: '5',
      attainmentDate: new Date(),
      courseId,
      graderId: kopaGrader.id,
      reporterId: kopa.id
    })
    // No enrolment yet, so it stays unsent and deletable
    await db.entries.create({
      id: 'kopa-entry',
      personId: 'hy-hlo-1',
      completionDate: new Date(),
      rawEntryId: rawEntry.id
    })
  })

  const batchesSeenBy = async (user) => {
    const { body } = await request('GET', '/api/sis_reports', { headers: headersFor(user) })
    return [...new Set(body.rows.map((row) => row.batchId))]
  }

  test('is listed for the KOPA user and the grader, and nobody else', async () => {
    assert.deepEqual(await batchesSeenBy(kopa), [batchId])
    assert.deepEqual(await batchesSeenBy(kopaGrader), [batchId])
    assert.deepEqual(await batchesSeenBy(outsider), [])
  })

  test('can be opened by the KOPA user', async () => {
    const { status } = await request('GET', `/api/sis_reports/offset/${batchId}`, { headers: headersFor(kopa) })
    assert.equal(status, 200)
  })

  test('can be deleted by the KOPA user but not by an outsider', async () => {
    const path = `/api/sis_reports/batch/${batchId}`
    assert.equal((await request('DELETE', path, { headers: headersFor(outsider) })).status, 401)
    assert.equal((await request('DELETE', path, { headers: headersFor(kopa) })).status, 200)
  })
})

describe('the credit range of a KOPA course', () => {
  const admin = async () => db.users.create({ name: 'admin', uid: 'admin', employeeId: '7009', isAdmin: true })

  const editCourse = async (changes) => {
    const course = await db.courses.findOne({ where: { courseCode: 'TKT90001' } })
    const body = { ...course.get({ plain: true }), graders: [kopaGrader.id], ...changes }
    return request('PUT', `/api/courses/${course.id}`, { headers: headersFor(await admin()), body })
  }

  test('is saved with the course', async () => {
    const { status, body } = await editCourse({ minCredits: '1', maxCredits: '10' })

    assert.equal(status, 200)
    assert.equal(body[0].minCredits, '1')
    assert.equal(body[0].maxCredits, '10')
  })

  for (const [why, range] of [
    ['min above max', { minCredits: '10', maxCredits: '1' }],
    ['only one end given', { minCredits: '1', maxCredits: null }],
    ['the default credits outside it', { minCredits: '6', maxCredits: '10' }]
  ]) {
    test(`is refused with ${why}`, async () => {
      assert.equal((await editCourse(range)).status, 400)
    })
  }

  const reportCredits = async (credits) => {
    await db.courses.update({ minCredits: '1', maxCredits: '10' }, { where: { courseCode: 'TKT90001' } })
    const { id: courseId } = await db.courses.findOne({ where: { courseCode: 'TKT90001' } })
    return request('POST', '/api/sis_raw_entries', {
      headers: headersFor(kopa),
      body: {
        courseId,
        graderId: kopaGrader.employeeId,
        data: [{ studentId: '011000002', grade: '3', credits, course: '' }]
      }
    })
  }

  // Past the range check the report goes on to the importer, which is not running here
  test('lets a report through with credits inside it', async () => {
    const { body } = await reportCredits('7,5')
    assert.doesNotMatch(JSON.stringify(body), /outside/)
  })

  test('refuses a report with credits outside it', async () => {
    const { body } = await reportCredits('12')
    assert.match(body.error, /12 credits for 011000002 is outside the 1–10 credits of TKT90001/)
  })
})
