const logger = require('@utils/logger')
const db = require('../models/index')

const getGraders = async (req, res) => {
  try {
    const graders = await db.graders.findAll()
    const cleanedGraders = graders.map(({ id, name }) => ({
      id,
      name,
    }))
    res.status(200).json(cleanedGraders)
  } catch (e) {
    console.log(e)
    res.status(500).json({ error: 'server went BOOM!' })
  }
}

module.exports = {
  getGraders,
}
