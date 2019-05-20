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
    }
  }
  `

  const client = new GraphQLClient(process.env.MOOC_ADDRESS, {
    headers: {
      Authorization: process.env.MOOC_TOKEN
    }
  })
  console.log('Starting GraphQL-query..')
  const { data } = await client.rawRequest(completionsQuery)
  console.log(
    `Found ${data.completions.length} completions for course ${course}`
  )
  return data.completions
}

module.exports = getCompletions
