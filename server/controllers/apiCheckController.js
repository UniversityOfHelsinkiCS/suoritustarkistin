const logger = require('@server/utils/logger')
const { eduwebGet, getRegistrationsByInstance } = require('../services/eduweb')
const { checkCompletions } = require('../services/pointsmooc')
const { checkCompletions: checkNewMoocCompletions } = require('../services/newMooc')
const { getAllCourseUnitEnrolments, activityPeriodCutoff, isActiveRealisation } = require('../services/importer')

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
    const result = await checkCompletions(req.params.id)
    return res.status(200).send(result)
  } catch (error) {
    if (error.message === 'Request failed with status code 404') {
      return res.status(200).send([])
    }
    handleDatabaseError(res, error)
  }
}

const checkNewMooc = async (req, res) => {
  try {
    const result = await checkNewMoocCompletions(req.params.id)
    return res.status(200).send(result)
  } catch (error) {
    if (error.message === 'Request failed with status code 404') {
      return res.status(200).send([])
    }
    handleDatabaseError(res, error)
  }
}

// Returns realisations unfiltered, flagging the ones the mooc cron would drop,
// so admins can see enrolments lost to the activityPeriod cutoff.
const checkSisu = async (req, res) => {
  try {
    const data = await getAllCourseUnitEnrolments(req.params.id)
    const cutoff = activityPeriodCutoff()

    const realisations = data.map((item) => ({
      activityPeriod: item.activityPeriod || null,
      enrollments: item.enrollments || [],
      droppedByCron: !isActiveRealisation(item, cutoff)
    }))

    return res.status(200).send({ cutoff: cutoff.toISOString().slice(0, 10), realisations })
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

module.exports = {
  checkEduweb,
  checkMooc,
  checkNewMooc,
  checkSisu
}
