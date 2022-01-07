const logger = require('@utils/logger')
const db = require('../models/index')
const { bscThesisEntryFactory } = require('../models/factory')
const {
  testCourses,
  testUsers,
  testCompletions,
  testRawEntries0to5,
  testRawEntriesHylHyv,
  getBatchId
} = require('../utils/common')


// These are to be used ONLY for test database and not in production

const deleteAllSisReports = async () => {
  logger.info('Deleting all sis reports in test database')
  try {
    await db.entries.destroy({ where: {} })
    await db.raw_entries.destroy({ where: {} })
  } catch (error) {
    logger.error(error.message)
  }
}

const deleteAllOodiReports = async () => {
  logger.info('Deleting all oodi reports in test database')
  try {
    await db.credits.destroy({ where: {} })
    await db.reports.destroy({ where: {} })
  } catch (error) {
    logger.error(error.message)
  }
}

const deleteAllCourses = async () => {
  logger.info('Deleting all courses in test database')
  try {
    await db.courses.destroy({ where: {} })
  } catch (error) {
    logger.error(error.message)
  }
}

const deleteAllUsers = async () => {
  logger.info('Deleting all users in test database')
  try {
    await db.users.destroy({ where: {} })
  } catch (error) {
    logger.error(error.message)
  }
}

const deleteAllJobs = async () => {
  logger.info('Deleting all users in test database')
  try {
    await db.jobs.destroy({ where: {} })
  } catch (error) {
    logger.error(error.message)
  }
}

const createTestCourses = async (courses) => {
  try {
    logger.info('Creating test courses')
    for (const { name, courseCode, language, gradeScale, credits, ...additional } of courses) {
      await db.courses.create({
        name,
        courseCode,
        language,
        gradeScale,
        credits: credits || "5,0",
        ...additional
      })
    }
  } catch (error) {
    logger.error(error.message)
  }
}

const createTestUsers = async (users) => {
  try {
    logger.info('Creating test users')
    for (const { name, employeeId, email, isGrader, isAdmin, uid } of users) {
      await db.users.create({
        name,
        employeeId,
        email,
        isGrader,
        isAdmin,
        uid
      })
    }
  } catch (error) {
    logger.error(error.message)
  }
}

const createTestSisCompletions = async (completions, entriesHylHyv, entries0to5) => {
  const transaction = await db.sequelize.transaction()
  try {
    logger.info('Creating test sis-completions')

    // Batch should have common data
    for (const { courseCode, graderName } of completions) {
      const course = await db.courses.findOne({
        where: {
          courseCode: courseCode
        }
      })
      const grader = await db.users.findOne({
        where: {
          name: graderName
        }
      })

      const attainmentDate = "2021-08-09T03:00:00.000Z"
      const batchId = getBatchId(course.courseCode)
      const testRawEntries = course.gradeScale === "sis-hyl-hyv" ? entriesHylHyv : entries0to5

      const getRegisteredStatus = () => {
        if (course.courseCode === "TKT10002") return 'PARTLY_REGISTERED'
        if (course.courseCode === "TKT10003") return 'REGISTERED'
        return 'NOT_REGISTERED'
      }

      const getSentStatus = () => {
        if (course.courseCode === "TKT10002" || course.courseCode === "TKT10003") return new Date()
        return null
      }

      // With individual completions
      for (const { studentNumber, grade } of testRawEntries) {

        const rawEntry = await db.raw_entries.create({
          studentNumber,
          batchId,
          grade,
          credits: course.credits,
          language: course.language,
          attainmentDate: attainmentDate,
          graderId: grader.id,
          reporterId: course.name.includes('Avoin yo') ? null : grader.id,
          courseId: course.id,
          moocCompletionId: null,
          moocUserId: null,
          registeredToMooc: course.name.includes('Avoin yo') ? attainmentDate : null
        }, { transaction })

        await db.entries.create({
          id: `entry-id-${rawEntry.id}`,
          personId: "entryPersonId",
          verifierPersonId: "entryVerifierpersonId",
          courseUnitRealisationId: "entryCourseUnitRealisationId",
          assessmentItemId: "entryVerifierpersonId",
          completionLanguage: rawEntry.language,
          completionDate: attainmentDate,
          rawEntryId: rawEntry.id,
          courseUnitId: "entryCourseUnitId",
          gradeScaleId: course.gradeScale,
          gradeId: rawEntry.grade,
          courseUnitRealisationName: {
            "fi": `courseUnitRealisationName-fi-${rawEntry.grade}`,
            "en": `courseUnitRealisationName-en-${rawEntry.grade}`,
            "sv": `courseUnitRealisationName-sv-${rawEntry.grade}`
          },
          sent: getSentStatus(course.courseCode),
          registered: getRegisteredStatus(course.courseCode)
        }, { transaction })
      }
    }
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    logger.error(error.message)
  }
}

const createTestOodiReports = async () => {
  logger.info('Creating test Oodi-reports')

  try {
    for (const { courseCode, graderName } of testCompletions) {
      const course = await db.courses.findOne({
        where: {
          courseCode: courseCode
        }
      })

      const grader = await db.users.findOne({
        where: {
          name: graderName
        }
      })

      const lastDownloaded = "2021-10-09T03:00:00.000Z"
      const reportDate = "15.09.21-162832"
      const completionDate = "8.9.2021"
      const fileName = course.name.includes('Avoin yo')
        ? `${course.courseCode}%${reportDate}_AUTOMATIC.dat`
        : `${course.courseCode}%${reportDate}_MANUAL.dat`

      const testReportData = course.gradeScale === "sis-hyl-hyv" ? testRawEntriesHylHyv : testRawEntries0to5

      const data = testReportData.map(({ studentNumber, grade }) => {
        return `
          ${studentNumber}##1#
          ${course.courseCode}#
          ${course.name}#
          ${completionDate}#0#
          ${grade}#106##
          ${grader.employeeId}#2#H930#####
          ${course.credits}
        `
      }).join('\n')

      await db.reports.create({
        fileName,
        lastDownloaded,
        graderId: grader.id,
        reporterId: course.name.includes('Avoin yo') ? null : grader.id,
        data
      })
    }
  } catch (error) {
    logger.error(error.message)
  }
}

const seedTestCompletions = async (req, res) => {
  try {
    const {
      testCompletions,
      testRawEntries0to5,
      testRawEntriesHylHyv
    } = req.body

    await createTestSisCompletions(testCompletions, testRawEntriesHylHyv, testRawEntries0to5)
    return res.status(200).send('OK')
  } catch (error) {
    logger.error(`Error seeding test completions: ${error.message}`)
    res.status(500).json({ error: error.message })
  }
}

const seedDatabaseForTests = async (req, res) => {
  try {
    logger.info('Seeding the test database')

    await deleteAllSisReports()
    await deleteAllOodiReports()
    await deleteAllCourses()
    await deleteAllUsers()
    await deleteAllJobs()
    await createTestCourses(testCourses)
    await createTestUsers(testUsers)
    await createTestSisCompletions(testCompletions, testRawEntriesHylHyv, testRawEntries0to5)
    await createTestOodiReports()
    return res.status(200).send('OK')

  } catch (error) {
    logger.error(`Error seeding the database: ${error.message}`)
    res.status(500).json({ error: error.message })
  }
}

const seedNoEntries = async (req, res) => {
  try {
    logger.info('Seeding the test database')
    await deleteAllSisReports()
    await deleteAllOodiReports()
    await deleteAllCourses()
    await deleteAllUsers()
    await deleteAllJobs()
    await createTestCourses(testCourses)
    await createTestUsers(testUsers)
    return res.status(200).send('OK')
  } catch (error) {
    logger.error(`Error seeding the database: ${error.message}`)
    res.status(500).json({ error: error.message })
  }
}


const seedBachelorData = async (req, res) => {
  try {
    await deleteAllSisReports()
    await deleteAllOodiReports()
    await deleteAllCourses()
    await deleteAllUsers()
    await deleteAllJobs()
    await createTestUsers(testUsers)
    const grader = await db.users.findOne({ where: { name: 'grader' } })
    const courses = [
      {
        name: "Kandidaatin tutkielma",
        courseCode: "TKT20013",
        language: "fi",
        gradeScale: "sis-0-5",
        credits: "6"
      },
      {
        name: "Kypsyysnäyte",
        courseCode: "TKT20014",
        language: "fi",
        gradeScale: "sis-hyl-hyv",
        credits: "0",
        useAsExtra: true
      },
      {
        name: "Tutkimustiedonhaku",
        courseCode: "TKT50002",
        language: "fi",
        gradeScale: "sis-hyl-hyv",
        credits: "1",
        useAsExtra: true
      },
      {
        name: "Äidinkielinen viestintä",
        courseCode: "TKT50001",
        language: "fi",
        gradeScale: "sis-hyl-hyv",
        credits: "3",
        useAsExtra: true
      }
    ]
    await createTestCourses(courses)
    const courseInstances = await db.courses.findAll({ where: { courseCode: ['TKT20013', 'TKT20014', 'TKT50002', 'TKT50001'] } })
    await grader.setCourses(courseInstances.map(({ id }) => id))
    await bscThesisEntryFactory('grader')
    return res.status(200).send('OK')
  } catch (error) {
    logger.error(`Error seeding the database: ${error.message}`)
    res.status(500).json({ error: error.message })
  }
}


const seedErilliskirjaus = async (req, res) => {
  try {
    await deleteAllSisReports()
    await deleteAllOodiReports()
    await deleteAllCourses()
    await deleteAllUsers()
    await deleteAllJobs()
    console.log("WWWHHHHAT")
    await createTestUsers(testUsers)
    const courses = [
      {
        name: "Versionhallinta",
        courseCode: "TKT21015",
        language: "fi",
        gradeScale: "sis-hyl-hyv",
        credits: "1",
        useAsExtra: true
      }
    ]
    await createTestCourses(courses)
    return res.status(200).send('OK')
  } catch (error) {
    logger.error(`Error seeding the database: ${error.message}`)
    res.status(500).json({ error: error.message })
  }
}

module.exports = {
  seedDatabaseForTests,
  createTestSisCompletions,
  seedTestCompletions,
  seedBachelorData,
  seedNoEntries,
  seedErilliskirjaus
}
