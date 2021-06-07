const moocApi = require('../config/moocApi')
const logger = require('@utils/logger')

const getCompletions = async (course) => {
  logger.info({ message: `Fetching completions for course ${course}` })
  const { data } = await moocApi.get(`/completions/${course}`)

  logger.info({ message: `Found total of ${data ? data.length : 0} completions` })
  return data
}

const postRegistrations = async (completionAndStudentIdList) => {
  try {
    logger.info({ message: 'Posting completion registrations to mooc'})
    const response = await moocApi.post(`/register-completions`, { completions: completionAndStudentIdList })
    logger.info({ message: `mooc-api response: ${response.statusText}`})
    return response.statusText
  } catch (error) {
    logger.error(
      `Error in updating confirmed registrations. Error: ${error}`
    )
  }
}

module.exports = {
  getCompletions,
  postRegistrations
}