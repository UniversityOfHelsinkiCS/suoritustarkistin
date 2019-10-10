const logger = require('@utils/logger')
const db = require('../models/index')

const getUsers = async (req, res) => {
  try {
    const users = await db.users.findAll()
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

const addUser = async (req, res) => {
  const user = req.body
  const newUser = await db.users.create(user)
  res.status(200).json(newUser)
}

const deleteAllUsers = async (req, res) => {
  await db.users.destroy({ where: {} })
  res.status(204).end()
}

module.exports = {
  getUsers,
  getGraders,
  getUsersGraders,
  addUser,
  deleteAllUsers
}
