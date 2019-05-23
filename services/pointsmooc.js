const { GraphQLClient } = require('graphql-request')

const courseNames = {
	AYTKT21018: 'elements-of-ai',
	AYTKT21018fi: 'elements-of-ai'
}

const getMultipleCourseCompletions = async courses => {
	const uniqueCourseNames = [...new Set(courses.map(c => courseNames[c]))]
	console.log(uniqueCourseNames)
	let completionData = []
	for (n of uniqueCourseNames) {
		console.log('Getting completions for', n)

		completionData = await completionData.concat(await getCompletions(n))
	}
	console.log(
		`Total of ${completionData.length} completions found for ${
			courses.length
		} courses.`
	)

	return completionData
}

const getCompletions = async course => {

	const completionsQuery = `
  {
    completions (course: "${course}") {
      id
      email
      completion_language
      student_number
      upstream_user_id
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

const postRegistration = completionId => {
	//not yet implemented
	console.log(
		`Completion ${completionId} is registered, updating to points.mooc.fi.`
	)
}

module.exports = {
	getMultipleCourseCompletions,
	postRegistration
}
