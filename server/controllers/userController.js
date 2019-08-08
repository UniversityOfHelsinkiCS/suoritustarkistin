const logger = require('@utils/logger')
const db = require('../models/index')

const getUsers = async (req, res) => {
  try {
    const users = await db.users.findAll()
    const cleanedGraders = users.map(({ id, name }) => ({
      id,
      name
    }))
    res.status(200).json(cleanedGraders)
  } catch (e) {
    logger.error(e)
    res.status(500).json({ error: 'server went BOOM!' })
  }
}

const addUser = async (req, res) => {
  const grader = req.body
  const newGrader = await db.users.create(grader)
  res.status(200).json(newGrader)
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
