const { GraphQLClient } = require('graphql-request')
const logger = require('@utils/logger')
const axios = require('axios')

const courseNames = {
  AYTKT21018: 'elements-of-ai',
  AYTKT21018fi: 'elements-of-ai',
  AYTKT21018sv: 'elements-of-ai'
}

const getEoAICompletions = async () => {
  const { data } = await axios.get(process.env.EOAI_URL, {
    headers: {
      Authorization: process.env.MOOC_TOKEN
    }
  })
  return data
}
const client = new GraphQLClient(process.env.MOOC_ADDRESS, {
  headers: {
    Authorization: process.env.MOOC_TOKEN
  }
})

const getMultipleCourseCompletions = async (courses) => {
  const uniqueCourseNames = [...new Set(courses.map((c) => courseNames[c]))]
  let completionData = []
  for (const n of uniqueCourseNames) {
    completionData = await completionData.concat(await getCompletions(n))
  }

  return completionData
}

const getCompletions = async (course) => {
  const completionsQuery = `
  {
    completions (course: "${course}") {
      id
      email
      completion_language
      student_number
      user_upstream_id
      grade
    }
  }
  `
  const { data } = await client.rawRequest(completionsQuery)

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
  getMultipleCourseCompletions,
  getCompletions,
  postRegistrations,
  getEoAICompletions
}
