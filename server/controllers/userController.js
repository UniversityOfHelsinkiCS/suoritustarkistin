const logger = require('@utils/logger')
const db = require('../models/index')

const getUsers = async (req, res) => {
  try {
    const users = await db.users.findAll()
    const cleanedGraders = users.map(
      ({ name, employeeId, isGrader, isAdmin }) => ({
        name,
        employeeId,
        isGrader,
        isAdmin
      })
    )
    res.status(200).json(cleanedGraders)
  } catch (e) {
    logger.error(e)
    res.status(500).json({ error: 'server went BOOM!' })
  }
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
  addUser,
  deleteAllUsers
}
