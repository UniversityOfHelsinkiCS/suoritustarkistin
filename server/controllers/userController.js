const logger = require('@utils/logger')
const db = require('../models/index')
const { resolveUser } = require('../services/importer')
const sendEmail = require('../utils/sendEmail')
const { forNewUser } = require('../utils/emailFactory')

const getUsers = async (req, res) => {
  try {
    const users = await db.users.findAll({
      include: [
        {
          model: db.courses,
          as: 'courses',
          attributes: {
            exclude: ['id', 'userCourses', 'createdAt', 'updatedAt']
          },
          through: {
            attributes: []
          }
        }
      ]
    })
    res.status(200).json(users)
  } catch (e) {
    logger.error(e.message)
    res.status(500).json({ error: 'server went BOOM!' })
  }
}

const getGraders = async (req, res) => {
  try {
    const graders = await db.users.findAll({ where: { isGrader: true } })
    res.status(200).json(graders)
  } catch (e) {
    logger.error(e.message)
    res.status(500).json({ error: 'server went BOOM!' })
  }
}

const getUsersGraders = async (req, res) => {
  res.status(200).json(req.user.isGrader ? [req.user] : [])
}

const addUser = async (req, res, next) => {
  try {
    const { courses, ...user } = req.body
    const newUser = await db.users.create(user)
    if (courses && courses.length)
      await Promise.all(courses.map((course) => newUser.addCourse(course, { through: "users_courses" })))
    res.status(200).json(newUser)
    sendEmail({
      to: newUser.email,
      replyTo: 'Toska <grp-toska@helsinki.fi>',
      subject: 'An user account to Suoritustarkistin is created for you!',
      html: forNewUser(newUser.name),
      attachments: [{
        filename: 'suotar.png',
        path: `${process.cwd()}/client/assets/suotar.png`,
        cid: 'toskasuotarlogoustcid'
      }]
    })
  } catch (e) {
    next(e)
  }
}

const deleteAllUsers = async (req, res) => {
  await db.users.destroy({ where: {} })
  res.status(204).end()
}

const editUser = async (req, res) => {
  try {
    const { courses, ...user } = req.body
    const [rows] = await db.users.update(user, {
      returning: true,
      where: { id: req.params.id }
    })
    if (!rows) res.status(400).json({ error: 'id not found.' })
    const userToAddCourses = await db.users.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: db.courses,
          as: 'courses',
          attributes: {
            exclude: ['id', 'userCourses', 'createdAt', 'updatedAt']
          },
          through: {
            attributes: []
          }
        }
      ]
    })
    await userToAddCourses.setCourses(courses)
    await userToAddCourses.reload()
    return res.status(200).json(userToAddCourses)
  } catch (e) {
    logger.error(e.message)
    res.status(500).json({ error: 'server went BOOM!' })
  }
}

const fetchUserDetails = async (req, res, next) => {
  try {
    const user = await resolveUser(req.body)
    return res.send(user)
  } catch (e) {
    next(e)
  }
}

const deleteUser = async (req, res, next) => {
  try {
    await db.users.destroy({ where: { id: req.params.id } })
    return res.status(200).send(req.params.id)
  } catch (e) {
    next(e)
  }
}

module.exports = {
  getUsers,
  getGraders,
  getUsersGraders,
  addUser,
  deleteAllUsers,
  editUser,
  fetchUserDetails,
  deleteUser
}

