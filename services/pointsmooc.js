const { GraphQLClient } = require('graphql-request')

const courseNames = {
  AYTKT21018: 'elements-of-ai'
}

const getCompletions = async (course) => {
  const completionsQuery = `
  {
    completions (course: "${courseNames[course]}") {
      id
      email
      completion_language
      student_number
      user_upstream_id
    }
  }
  `

  const client = new GraphQLClient(process.env.MOOC_ADDRESS, {
    headers: {
      Authorization: process.env.MOOC_TOKEN
    }
  })

  const { data } = await client.rawRequest(completionsQuery)

  return data.completions
}

module.exports = getCompletions
