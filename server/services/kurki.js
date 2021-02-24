const kurkiApi = require('../config/kurkiApi')
const logger = require('@utils/logger')

const getCourses = async () => {
  logger.info({ message: `Fetching course instance from Kurki` })
  const { data } = await kurkiApi.get(`/frozen`)

  logger.info({ message: `Found total of ${data ? data.length : 0} completions` })
  return data
}

const getCompletions = async (kurkiId) => {
  logger.info({ message: `Fetching completions from Kurki for course ${kurkiId}` })
  const { data } = await kurkiApi.get(`/${kurkiId}/frozen-participants`)

  logger.info({ message: `Found total of ${data ? data.length : 0} completions` })
  return data
}

module.exports = { getCourses, getCompletions }