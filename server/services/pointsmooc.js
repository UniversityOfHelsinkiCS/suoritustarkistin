const { GraphQLClient } = require('graphql-request')
const moocApi = require('../config/moocApi')
const logger = require('@utils/logger')
const axios = require('axios')

const client = new GraphQLClient(process.env.MOOC_ADDRESS, {
  headers: {
    Authorization: process.env.MOOC_TOKEN
  }
})

const sisGetCompletions = async (course) => {
  logger.info({ message: `Fetching completions for course ${course}`, sis:true })
  const { data } = await moocApi.get(`/completions/${course}`)

  logger.info({ message: `Found total of ${data ? data.length : 0} completions`, sis:true })
  return data
}

const getCompletions = async (course) => {
  if (course.includes('AYTKT21018')) return await getCompletionsFromRest() // Elements of AI completions list is too large for GraphQL
  return await getCompletionsFromGraphQL(course)
}

const getCompletionsFromRest = async () => {
  const { data } = await axios.get(process.env.EOAI_URL, {
    headers: {
      Authorization: process.env.MOOC_TOKEN
    }
  })
  return data
}

const getEoAICompletions = async () => {
  logger.info("Fetching Elements of AI -completions")
  const { data } = await axios.get(process.env.EOAI_URL, {
    headers: {
      Authorization: process.env.MOOC_TOKEN
    }
  })
  logger.info(`Found total of ${data.length} completions`)
  return data
}

const getCompletionsFromGraphQL = async (course) => {
  logger.info(`Fetching completions for course ${course}`)
  const completionsQuery = `
  {
    completions (course: "${course}") {
      id
      email
      completion_language
      student_number
      user_upstream_id
      grade
      completion_date
      tier
    }
  }
  `
  const { data } = await client.rawRequest(completionsQuery)
  logger.info(`Found total of ${(data && data.completions) ? data.completions.length : 0} completions`)
  return data.completions
}

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

module.exports = {
  getCompletions,
  sisGetCompletions,
  postRegistrations,
  getEoAICompletions
}
