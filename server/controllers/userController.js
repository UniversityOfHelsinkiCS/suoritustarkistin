const logger = require('@utils/logger')
const db = require('../models/index')
const { resolveUser } = require('../services/importer')


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
    const user = req.body
    const newUser = await db.users.create(user)
    res.status(200).json(newUser)
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
    const user = req.body

    const [rows, [updatedUser]] = await db.users.update(user, {
      returning: true,
      where: { id: req.params.id }
    })
    if (rows) return res.status(200).json(updatedUser)
    return res.status(400).json({ error: 'id not found.' })
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

