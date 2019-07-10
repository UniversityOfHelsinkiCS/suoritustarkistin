const logger = require('@utils/logger')
const db = require('../models/index')

const getGraders = async (req, res) => {
  try {
    const graders = await db.graders.findAll()
    const cleanedGraders = graders.map(({ id, name }) => ({
      id,
      name
    }))
    res.status(200).json(cleanedGraders)
  } catch (e) {
    logger.error(e)
    res.status(500).json({ error: 'server went BOOM!' })
  }
}

const addGrader = async (req, res) => {
  const grader = req.body
  const newGrader = await db.graders.create(grader)
  res.status(200).json(newGrader)
}

const deleteAllGraders = async (req, res) => {
  await db.graders.destroy({ where: {} })
  res.status(204).end()
}

module.exports = {
  getGraders,
  addGrader,
  deleteAllGraders
}
