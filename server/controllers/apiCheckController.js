const logger = require('@utils/logger')
const db = require('../models/index')
const { eduwebGet, getRegistrationsByInstance } = require('../services/eduweb')


const handleDatabaseError = (res, error) => {
  logger.error(error.message)
  return res.status(500).json({ error: error.message })
}

const checkEduweb = async (req, res) => {
  try {
    const instances = await eduwebGet(req.params.id)
    const enrollments = await getRegistrationsByInstance(req.params.id)
    return res.status(200).send({ instances, enrollments })
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

const checkMooc = async (req, res) => {
  try {
    const result = []
    
    return res.status(200).send(result)
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

module.exports = {
  checkEduweb,
  checkMooc
}
