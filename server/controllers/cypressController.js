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

const createTestCourses = async () => {
  try {
    logger.info('Creating test courses')
    for (const { name, courseCode, language, gradeScale } of testCourses) {
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

const createTestUsers = async () => {
  try {
    logger.info('Creating test users')
    for (const { name, employeeId, email, isGrader, isAdmin, uid } of testUsers) {
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

const createTestSisCompletions = async () => {
  const transaction = await db.sequelize.transaction()
  try {
    logger.info('Creating test sis-completions')
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

      const attainmentDate = "2021-08-09T03:00:00.000Z"
      const batchId = getBatchId(course.courseCode)
      const testRawEntries = course.gradeScale === "sis-hyl-hyv" ? testRawEntriesHylHyv : testRawEntries0to5

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
          personId: `personId-${rawEntry.id}`,
          verifierPersonId: `verifierpersonId-${rawEntry.id}`,
          courseUnitRealisationId: `verifierpersonId-${rawEntry.id}`,
          assessmentItemId: `verifierpersonId-${rawEntry.id}`,
          completionLanguage: rawEntry.language,
          completionDate: attainmentDate,
          rawEntryId: rawEntry.id,
          courseUnitId: `courseUnitId-${rawEntry.id}`,
          gradeScaleId: course.gradeScale,
          gradeId: rawEntry.grade,
          courseUnitRealisationName: {
            "fi": `courseUnitRealisationName-fi-${rawEntry.id}`,
            "en": `courseUnitRealisationName-en-${rawEntry.id}`,
            "sv": `courseUnitRealisationName-sv-${rawEntry.id}`
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
      return `${studentNumber}##1#${course.courseCode}#${course.name}#${completionDate}#0#${grade}#106##${grader.employeeId}#2#H930#####${course.credits}`
    }).join('\n') 

    await db.reports.create({
      fileName,
      lastDownloaded,
      graderId: grader.id,
      reporterId: course.name.includes('Avoin yo') ? null : grader.id,
      data
    })
  }
}

const seedDatabaseForTests = async () => {
  logger.info('Seeding the test database')
  await deleteAllSisReports()
  await deleteAllOodiReports()
  await deleteAllCourses()
  await deleteAllUsers()
  await deleteAllJobs()
  await createTestCourses()
  await createTestUsers()
  await createTestSisCompletions()
  await createTestOodiReports()  
}

module.exports = {
  seedDatabaseForTests
}
