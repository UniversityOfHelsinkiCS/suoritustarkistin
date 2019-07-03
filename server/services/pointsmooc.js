const fs = require('fs')
const { GraphQLClient } = require('graphql-request')
const db = require('../models/index')
const Sequelize = require('sequelize')
const op = Sequelize.op

const courseNames = {
  AYTKT21018: 'elements-of-ai',
  AYTKT21018fi: 'elements-of-ai',
  AYTKT21018sv: 'elements-of-ai'
}

const client = new GraphQLClient(process.env.MOOC_ADDRESS, {
  headers: {
    Authorization: process.env.MOOC_TOKEN
  }
})

const getMultipleCourseCompletions = async (courses) => {
  const uniqueCourseNames = [...new Set(courses.map((c) => courseNames[c]))]
  let completionData = []
  for (n of uniqueCourseNames) {
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
    client.request(registerMutation, variables)
    // if (data) {
    //   const registeredCompletions = data.registerCompletion.map(
    //     ({ completion }) => completion.id
    //   )
    //   return registeredCompletions
    // } else {
    //   return []
    // }
  } catch (e) {
    console.log(
      `Error in updating confirmed registrations. Error message:\n${e}`
    )
  }
}

module.exports = {
  getMultipleCourseCompletions,
  postRegistrations
}
