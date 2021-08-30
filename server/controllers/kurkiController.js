const logger = require('@utils/logger')
const db = require('../models/index')
const { getCourses } = require('../services/kurki')
const { createCourse } = require('../scripts/createCourse')
const { processKurkiEntries } = require('../scripts/processKurkiEntries')

const getKurkiCourses = async (req, res) => {
  try {
    const courses = await getCourses()
    res.status(200).json(courses)
  } catch (e) {
    logger.error(e.message)
    res.status(500).json({ error: e.message })
  }
}

const addKurkiRawEntries = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(400).json({ error: 'User is not authorized to create SIS-reports.' })
    }

    const {
      kurkiId,
      name,
      credits,
      language,
      graderUid
    } = req.body.kurkiCourse

    if (!req.body.kurkiCourse || !kurkiId) {
      return res.status(400).json({ error: 'Course details missing' })
    }

    const courseCode = kurkiId.split('.')[0]

    let course = await db.courses.findOne({
      where: {
        courseCode: courseCode
      }
    })

    const grader = await db.users.findOne({
      where: {
        uid: graderUid
      }
    })

    if (!grader) {
      return res.status(400).json({ error: `No grader-employee found with the ID: ${graderUid}. Check that the user has already visited Suotar` })
    }

    if (!course) {
      course = await createCourse({
        name,
        courseCode,
        language,
        credits,
        graders: [grader.id]
      })
    }

    const result = await processKurkiEntries({ kurkiId, course, grader })

    if (result.message === "success" || result.message === "no new entries") {
      return res.status(200).json({ message: result.message, kurkiId })
    }
    logger.error({ message: result.message })
    return res.status(500).json({ error: result.message })
  } catch (e) {
    logger.error(e.message)
    res.status(500).json({ error: e.message })
  }
}

module.exports = {
  getKurkiCourses,
  addKurkiRawEntries
}
