const logger = require('@utils/logger')
const db = require('../models/index')
const { Op } = require('sequelize')
const _ = require('lodash')
const { isValidCourse } = require('@root/utils/validators')

const cleanCourses = (courses) => {
  return courses.map((course) => ({
    id: course.id,
    name: course.name,
    courseCode: course.courseCode,
    language: course.language,
    credits: course.credits,
    isMooc: course.isMooc,
    autoSeparate: course.autoSeparate,
    graders: course.graders
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
    res.status(200).json(cleanCourses([newCourseWithGraders]))
  } catch (e) {
    await transaction.rollback()
    logger.error(e.message)
    res.status(500).json({ error: 'server went BOOM!' })
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
    logger.error(e.message)
    res.status(500).json({ error: 'server went BOOM!' })
  }
}

const deleteAllCourses = async (req, res) => {
  await db.courses.destroy({ where: {} })
  res.status(204).end()
}

const deleteCourse = async (req, res) => {
  await db.courses.destroy({ where: { id: req.params.id } })
  return res.status(200).json({ id: req.params.id })
}

module.exports = {
  getCourses,
  getUsersCourses,
  addCourse,
  editCourse,
  deleteAllCourses,
  deleteCourse
}
