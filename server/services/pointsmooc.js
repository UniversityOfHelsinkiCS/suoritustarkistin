// const { GraphQLClient } = require('graphql-request')
const moocApi = require('../config/moocApi')
const logger = require('@utils/logger')

/*
const client = new GraphQLClient(process.env.MOOC_ADDRESS, {
  headers: {
    Authorization: process.env.MOOC_TOKEN
  }
})
*/

const getCompletions = async (course) => {
  logger.info({ message: `Fetching completions for course ${course}` })
  const { data } = await moocApi.get(`/completions/${course}`)

  logger.info({ message: `Found total of ${data ? data.length : 0} completions` })
  return data
}

/* This can be removed once we verify that the REST is working
const postRegistrations = async (completionAndStudentIdList) => {
  const registerMutation = `
    mutation registerCompletion($completions: [CompletionArg!]) {
      registerCompletion(completions: $completions)
    }
  `
  const variables = {
    completions: completionAndStudentIdList
  }

  try {
    const data = await client.request(registerMutation, variables)
    return data.registerCompletion
  } catch (e) {
    logger.error(
      `Error in updating confirmed registrations. Error message:\n${e}`
    )
  }
}
*/

const postRegistrations = async (completionAndStudentIdList) => {
  try {
    const response = await moocApi.post(`/register-completions`, { completions: completionAndStudentIdList })
    for (const [key, value] of Object.entries(response)) {
      logger.info(key)
      logger.info(value)
      logger.info("----")
    }
    return response.data.message
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