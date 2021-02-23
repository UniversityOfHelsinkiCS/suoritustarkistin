const kurkiApi = require('../config/kurkiApi')
const logger = require('@utils/logger')

const getCourses = async () => {
  logger.info({ message: `Fetching course instance from Kurki` })
  const { data } = await kurkiApi.get(`/frozen`)

  logger.info({ message: `Found total of ${data ? data.length : 0} completions` })
  return data
}

module.exports = { getCourses }