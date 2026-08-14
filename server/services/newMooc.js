const logger = require('@server/utils/logger')
const newMoocApi = require('../config/newMoocApi')
const { sendSentryError } = require('../utils/sentry')

const getCompletions = async (course, registeredIncluded = false) => {
  const path = registeredIncluded
    ? `/study-registry/completions/${course}`
    : `/study-registry/completions/${course}?exclude_already_registered=true`

  logger.info({ message: `Fetching completions for course ${course}` })

  const { data } = await newMoocApi.get(path)

  if (!Array.isArray(data)) {
    throw new Error(
      `Completions response for ${course} was not an array. This probably means that the course could not found on MOOC.`
    )
  }

  logger.info({ message: `Found total of ${data.length} completions, ${course}` })
  return data
}

const postRegistrations = async (completionAndStudentIdList, { report = true } = {}) => {
  try {
    logger.info({ message: `Posting ${completionAndStudentIdList.length} completion registrations to new mooc` })

    const response = await newMoocApi.post(
      '/study-registry/completion-registered-to-study-registry',
      completionAndStudentIdList
    )

    logger.info({ message: `new mooc-api response: ${response.statusText}` })
    return response.statusText
  } catch (error) {
    logger.error(`Error in updating ${completionAndStudentIdList.length} confirmed registrations. Error: ${error}`)
    // Completions stay unmarked in new mooc until someone intervenes. registerChunks
    // opts out for its per-entry retries, which would otherwise be an event per student.
    if (report)
      sendSentryError('Posting completion registrations to new mooc failed', error, {
        completions: completionAndStudentIdList.length
      })
    if (completionAndStudentIdList.length === 1) {
      // oxlint-disable-next-line no-console
      console.log(JSON.stringify(completionAndStudentIdList))
    }
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
