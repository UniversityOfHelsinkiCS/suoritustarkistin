const kurkiApi = require('../config/kurkiApi')
const logger = require('@utils/logger')

const getCourses = async () => {
  if (process.env.NODE_ENV === 'staging') {
    return []
  }
  logger.info({ message: `Fetching course instances from Kurki`, sis:true })
  const { data } = await kurkiApi.get(`/frozen`)

  if (data === undefined) {
    logger.error({ message: 'Error fetching course instances from Kurki', sis:true })
    return []
  }

  logger.info({ message: `Found total of ${data ? data.length : 0} course instances`, sis:true })
  return data
}

const getCompletions = async (kurkiId) => {
  if (process.env.NODE_ENV === 'staging') {
    return []
  }
  logger.info({ message: `Fetching completions from Kurki for course ${kurkiId}`, sis:true })
  const { data } = await kurkiApi.get(`/${kurkiId}/frozen-participants`)

  if (data === undefined) {
    logger.error({ message: 'Error fetching completions from Kurki', sis:true })
    return []
  }

  logger.info({ message: `Found total of ${data ? data.length : 0} completions`, sis:true })
  return data
}

const postTransferredId = async (kurkiId) => {
  logger.info({ message: `Posting transferred course back to Kurki`})
  const result = await kurkiApi.post(`/${kurkiId}/students-transferred`)

  if (result.status === 200) {
    logger.info({ message: `Posting successful with status code ${result.status}`, sis:true })
    return { message: "success" }
  }

  return { message: "Failed posting transferral to Kurki" }
}

module.exports = { getCourses, getCompletions, postTransferredId }