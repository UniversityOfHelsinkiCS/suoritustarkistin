const logger = require('@server/utils/logger')
const newMoocApi = require('../config/newMoocApi')
const { sendSentryError } = require('../utils/sentry')

// Logged on every fetch, so a failing course can be diffed against a healthy one from the
// same run. The token's length is included, never its value: an empty or double-prefixed
// Authorization is still a live hypothesis for the bad body, and the length settles it.
const describeResponse = (response, course, path) => ({
  course,
  path,
  status: response.status,
  contentType: response.headers['content-type'],
  requestId: response.headers['request-id'],
  authorizationLength: (newMoocApi.defaults.headers.Authorization || '').length
})

const getCompletions = async (course, registeredIncluded = false) => {
  const path = registeredIncluded
    ? `/study-registry/completions/${course}`
    : `/study-registry/completions/${course}?exclude_already_registered=true`

  logger.info({ message: `Fetching completions for course ${course}` })

  const response = await newMoocApi.get(path)
  const { data } = response
  const details = describeResponse(response, course, path)

  // debugging why we seem to be getting bad data from fetching SON-100 course completions
  if (!Array.isArray(data)) {
    const raw = typeof data === 'string' ? data : JSON.stringify(data)
    const payload = {
      ...details,
      type: typeof data,
      bytes: raw ? raw.length : 0,
      body: raw === undefined ? 'undefined' : String(raw).slice(0, 500)
    }

    logger.error({ message: `Completions payload for ${course} was not an array: ${JSON.stringify(payload)}` })

    const error = new Error(`Completions response for ${course} was not an array (${payload.type}, ${payload.bytes}B)`)
    sendSentryError('Bad completions payload from new mooc', error, payload)
    throw error
  }

  logger.info({ message: `Found total of ${data.length} completions, ${course}, ${JSON.stringify(details)}` })
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
