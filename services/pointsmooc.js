const { GraphQLClient } = require('graphql-request')

const courseNames = {
  AYTKT21018: 'elements-of-ai'
}

const getCompletions = async (course) => {
  const usersQuery = `
   {
    users {
      id
      administrator
      last_name
      completed_enough
	  }
  }
  `
  const completionsQuery = `
  {
    completions (course: "${courseNames[course]}") {
      id
      student_number
      completion_language
    }
  }
  `

  const client = new GraphQLClient('http://localhost:4000', {
    headers: {
      Authorization: process.env.MOOC_TOKEN
    }
  })
  const { data } = await client.rawRequest(usersQuery)
  return data
}

module.exports = getCompletions
