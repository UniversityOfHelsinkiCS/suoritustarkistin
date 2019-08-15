const logger = require('@utils/logger')
const db = require('../models/index')

const getUsers = async (req, res) => {
  try {
    const users = await db.users.findAll()
    res.status(200).json(users)
  } catch (e) {
    logger.error(e)
    res.status(500).json({ error: 'server went BOOM!' })
  }
}

const getGraders = async (req, res) => {
  try {
    const users = await db.users.findAll()

    if (req.user.isAdmin) {
      res.status(200).json(users.filter((u) => u.isGrader))
    } else if (req.user.isGrader) {
      res
        .status(200)
        .json(users.filter((u) => u.employeeId === req.user.employeeId))
    } else {
      res.status(401).json({
        error:
          'You are not authorized to report course credits. Contact toska-grp@cs.helsinki.fi if you should be able to use the tool.'
      })
    }
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
  getGraders,
  addUser,
  deleteAllUsers
}
