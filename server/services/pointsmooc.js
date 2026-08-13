const logger = require('@server/utils/logger')
const moocApi = require('../config/moocApi')
const { sendSentryError } = require('../utils/sentry')

const getCompletions = async (course, registeredIncluded = false) => {
  logger.info({ message: `Fetching completions for course ${course}` })

  // If registeredIncluded=true, also the ones that are already marked as registered to SIS will be fetched from mooc api
  const { data } = registeredIncluded
    ? await moocApi.get(`/completions/${course}?registered=true`)
    : await moocApi.get(`/completions/${course}`)

  logger.info({ message: `Found total of ${data ? data.length : 0} completions, ${course}` })
  return data
}

const postRegistrations = async (completionAndStudentIdList, { report = true } = {}) => {
  try {
    logger.info({ message: 'Posting completion registrations to mooc' })
    const response = await moocApi.post(`/register-completions`, { completions: completionAndStudentIdList })
    logger.info({ message: `mooc-api response: ${response.statusText}` })
    return response.statusText
  } catch (error) {
    logger.error({
      message: `Error in updating confirmed registrations: ${error.message}`,
      status: error.response?.status,
      data: error.response?.data
    })
    // Completions stay unmarked in mooc until someone intervenes. registerChunks opts
    // out for its per-entry retries, which would otherwise be an event per student.
    if (report)
      sendSentryError('Posting completion registrations to mooc failed', error, {
        completions: completionAndStudentIdList.length
      })
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
