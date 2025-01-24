const logger = require('@utils/logger')
const moocApi = require('../config/moocApi')

const getCompletions = async (course, registeredIncluded = false) => {
  logger.info({ message: `Fetching completions for course ${course}` })

  // If registeredIncluded=true, also the ones that are already marked as registered to SIS will be fetched from mooc api
  const { data } = registeredIncluded
    ? await moocApi.get(`/completions/${course}?registered=true`)
    : await moocApi.get(`/completions/${course}`)

  logger.info({ message: `Found total of ${data ? data.length : 0} completions` })
  return data
}

const postRegistrations = async (completionAndStudentIdList) => {
  try {
    logger.info({ message: 'Posting completion registrations to mooc' })
    logger.info('completionAndStudentIdList:', JSON.stringify(completionAndStudentIdList))
    logger.info(JSON.stringify(completionAndStudentIdList))
    logger.info(completionAndStudentIdList)
    const response = await moocApi.post(`/register-completions`, { completions: completionAndStudentIdList })
    logger.info({ message: `mooc-api response: ${response.statusText}` })
    return response.statusText
  } catch (error) {
    logger.error(error)
    logger.error(`Error in updating confirmed registrations. Error: ${error}`)
  }
}

// Used for ApiCheck-tab
const checkCompletions = async (course) => {
  // If registeredIncluded=true, also the ones that are already marked as registered to SIS will be fetched from mooc api
  const { data } = await moocApi.get(`/completions/${course}`)
  return data
}

module.exports = {
  getCompletions,
  postRegistrations,
  checkCompletions
}
