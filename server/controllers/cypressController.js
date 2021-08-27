const logger = require('@utils/logger')
const db = require('../models/index')
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
    for (const { name, courseCode, language, gradeScale } of courses) {
      await db.courses.create({
        name,
        courseCode,
        language,
        gradeScale,
        credits: "5,0"
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
          }
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

module.exports = {
  seedDatabaseForTests,
  createTestSisCompletions,
  seedTestCompletions
}
