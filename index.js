require('dotenv').config()

const getRegistrations = require('./services/eduweb')
const hasOodiEntry = require('./services/oodikone')
const getCompletions = require('./services/pointsmooc')

const courseCodes = ['AYTKT21018']

const script = async (course) => {
  try {
    const registrations = await getRegistrations(course)
    const completions = await getCompletions(course)
    console.log('starting matching')
    let matches = []
    for (const registration of registrations) {
      for (const completion of completions) {
        if (
          completion.email === registration.email ||
          completion.email === registration.mooc
        ) {
          const { id, ...rest } = completion
          matches = matches.concat({
            ...rest,
            moocId: id,
            studentId: registration.onro,
            courseId: course
          })
        }
      }
    }
    console.log(`Found ${matches.length} matches for course ${course}.`)
    console.log('Example: ', matches[0])
    console.log(
      'Example has oodi entry:',
      await hasOodiEntry(matches[0].studentId, course)
    )
  } catch (error) {
    console.log('Error:', error.message)
  }
}

courseCodes.forEach((course) => {
  script(course)
})
