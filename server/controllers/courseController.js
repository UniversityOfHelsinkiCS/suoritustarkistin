const logger = require('@utils/logger')
const db = require('../models/index')
const { Op } = require('sequelize')
const _ = require('lodash')
const { isValidCourse } = require('@root/utils/validators')
const { getResponsibles } = require('../services/importer')


const cleanCourses = (courses) => {
  return courses.map((course) => ({
    id: course.id,
    name: course.name,
    courseCode: course.courseCode,
    language: course.language,
    credits: course.credits,
    graders: course.graders,
    gradeScale: course.gradeScale,
    useAsExtra: course.useAsExtra
  }))
}

const getCourses = async (req, res) => {
  try {
    const courses = await db.courses.findAll({
      include: [
        {
          model: db.users,
          as: 'graders',
          attributes: {
            exclude: ['userCourses', 'createdAt', 'updatedAt']
          },
          through: {
            attributes: []
          }
        }
      ]
    })
    res.status(200).json(cleanCourses(courses))
  } catch (e) {
    logger.error(e.message)
    res.status(500).json({ error: 'server went BOOM!' })
  }
}

const getUsersCourses = async (req, res) => {
  try {
    const user = await db.users.findOne({
      where: {
        id: req.user.id
      },
      include: [
        {
          model: db.courses,
          as: 'courses',
          attributes: {
            exclude: ['userCourses', 'createdAt', 'updatedAt']
          },
          through: {
            attributes: []
          }
        }
      ]
    })
    res.status(200).json(cleanCourses(user.courses))
  } catch (e) {
    logger.error(e.message)
    res.status(500).json({ error: 'server went BOOM!' })
  }
}

const addCourse = async (req, res) => {

  const transaction = await db.sequelize.transaction()

  try {
    let course = req.body
    const graders = course.graders

    if (!isValidCourse(course))
      return res.status(400).json({ error: 'Malformed course data.' })

    delete course.graders
    const newCourse = await db.courses.create(course, transaction)
    for (const graderId of graders) {
      const user = (
        await db.users.findOne({
          where: {
            id: graderId
          }, transaction
        })
      )

      await user.addCourse(newCourse, { through: "users_courses" }, transaction)
    }

    const newCourseWithGraders = await db.courses.findOne({
      where: { id: newCourse.id },
      include: [
        {
          model: db.users,
          as: 'graders',
          attributes: {
            exclude: ['userCourses', 'createdAt', 'updatedAt']
          },
          through: {
            attributes: []
          }
        }
      ]
    })

    transaction.commit()
    return res.status(200).json(cleanCourses([newCourseWithGraders]))
  } catch (e) {
    await transaction.rollback()
    if (e.message === "Validation error") {
      logger.error(`Course with the course code already exists`)
      return res.status(400).json({ error: `Course with the course code already exists` })
    }
    logger.error(e.message)
    return res.status(500).json({ error: 'Creating a new course failed' })
  }
}

const editCourse = async (req, res) => {

  const transaction = await db.sequelize.transaction()

  try {
    let course = req.body
    const graders = course.graders

    if (!isValidCourse(course))
      return res.status(400).json({ error: 'Malformed course data.' })

    delete course.graders
    const [rows, [updatedCourse]] = await db.courses.update(course, {
      returning: true,
      where: { id: req.params.id }
    })

    if (rows) {
      const usersCourses = await db.users_courses.findAll({
        where: {
          courseId: updatedCourse.id
        }
      })

      const gradersForRemoval = _.difference(usersCourses.map((uc) => uc.userId), graders)

      if (gradersForRemoval.length) {
        for (const graderId of gradersForRemoval) {
          await db.users_courses.destroy({
            where: {
              [Op.and]: [
                { user_id: graderId },
                { course_id: updatedCourse.id }
              ]
            }, transaction
          })
        }
      }

      for (const graderId of graders) {
        const user = (
          await db.users.findOne({
            where: {
              id: graderId
            }, transaction
          })
        )

        if (!usersCourses.find((uc) => uc.userId === graderId)) {
          await user.addCourse(updatedCourse, { through: "users_courses" }, transaction)
        }
      }

      transaction.commit()

      const updatedCourseWithGraders = await db.courses.findOne({
        where: { id: updatedCourse.id },
        include: [
          {
            model: db.users,
            as: 'graders',
            attributes: {
              exclude: ['userCourses', 'createdAt', 'updatedAt']
            },
            through: {
              attributes: []
            }
          }
        ]
      })
      return res.status(200).json(cleanCourses([updatedCourseWithGraders]))
    }

    return res.status(400).json({ error: 'id not found.' })
  } catch (e) {
    if (e.message === "Validation error") {
      logger.error(`Course with the course code already exists`)
      return res.status(400).json({ error: `Course with the course code already exists` })
    }
    logger.error(e.message)
    res.status(500).json({ error: 'server went BOOM!' })
  }
}

const unsentEntries = async (id) => {
  const rawEntries = await db.raw_entries.findAll({
    where: {
      courseId: id
    },
    include: [
      { model: db.entries, as: 'entry' }
    ]
  })
  const notSentYet = rawEntries.filter(({ entry }) => !entry.sent)
  return notSentYet ? notSentYet.map((rawEntry) => rawEntry.id) : []
}

const confirmDeletion = async (req, res) => {
  try {
    const unsent = await unsentEntries(req.params.id)
    res.status(200).json({ unsent: unsent.length })
  } catch (e) {
    res.status(500).json({ error: "Server went BOOM!" })
  }

}

const deleteCourse = async (req, res) => {
  const transaction = await db.sequelize.transaction()
  try {
    const unsent = await unsentEntries(req.params.id)
    await db.raw_entries.destroy({ where: { id: unsent }, transaction })
    await db.courses.destroy({ where: { id: req.params.id }, transaction })
    transaction.commit()
    res.status(200).json({ id: req.params.id })
  } catch (error) {
    transaction.rollback()
    res.status(500).json({ error: "Server went BOOM!" })
  }
}

const getCourseResponsibles = async (req, res) => res.send(await getResponsibles(req.params.courseCode))

module.exports = {
  getCourses,
  getUsersCourses,
  addCourse,
  editCourse,
  confirmDeletion,
  deleteCourse,
  getCourseResponsibles
}
