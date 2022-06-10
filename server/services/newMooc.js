/* Mostly a copy of pointsMooc for now, updated once new api available */
const logger = require('@utils/logger')
const newMoocApi = require('../config/newMoocApi')

const getCompletions = async (course, registeredIncluded = false) => {
  logger.info({ message: `Fetching completions for course ${course}` })

  // If registeredIncluded=true, also the ones that are already marked as registered to SIS will be fetched from mooc api
  // Will this change for the new api?
  const { data } = registeredIncluded
    ? await newMoocApi.get(`/completions/${course}?registered=true`)
    : await newMoocApi.get(`/completions/${course}`)

  logger.info({ message: `Found total of ${data ? data.length : 0} completions` })
  return data
}

const postRegistrations = async (completionAndStudentIdList) => {
  try {
    logger.info({ message: 'Posting completion registrations to mooc' })
    const response = await newMoocApi.post(`/register-completions`, { completions: completionAndStudentIdList })
    logger.info({ message: `mooc-api response: ${response.statusText}` })
    return response.statusText
  } catch (error) {
    logger.error(`Error in updating confirmed registrations. Error: ${error}`)
  }
}

// Used for ApiCheck-tab
const checkCompletions = async (course) => {
  // If registeredIncluded=true, also the ones that are already marked as registered to SIS will be fetched from mooc api
  const { data } = await newMoocApi.get(`/completions/${course}`)
  return data
}

module.exports = {
  getCompletions,
  postRegistrations,
  checkCompletions
}
