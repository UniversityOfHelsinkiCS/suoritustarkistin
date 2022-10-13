const logger = require('@utils/logger')
const newMoocApi = require('../config/newMoocApi')

const getCompletions = async (course) => {
  logger.info({ message: `Fetching completions for course ${course}` })

  const { data } = await newMoocApi.get(`/study-registry/completions/${course}`)

  logger.info({ message: `Found total of ${data ? data.length : 0} completions` })
  return data
}

const postRegistrations = async (completionAndStudentIdList) => {
  try {
    logger.info({ message: 'Posting completion registrations to new mooc' })
    const response = await newMoocApi.post(
      '/study-registry/completion-registered-to-study-registry',
      completionAndStudentIdList
    )
    logger.info({ message: `new mooc-api response: ${response.statusText}` })
    return response.statusText
  } catch (error) {
    logger.error(`Error in updating confirmed registrations. Error: ${error}`)
  }
}

// Used for ApiCheck-tab
const checkCompletions = async (course) => {
  const { data } = await newMoocApi.get(`/study-registry/completions/${course}`)
  return data
}

module.exports = {
  getCompletions,
  postRegistrations,
  checkCompletions
}
