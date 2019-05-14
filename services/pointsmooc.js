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
    }
  }
  `

  const client = new GraphQLClient('http://localhost:4000', {
    headers: {
      Authorization: process.env.MOOC_TOKEN
    }
  })
  const { data } = await client.rawRequest(completionsQuery)
  return data
}

module.exports = getCompletions
