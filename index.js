require('dotenv').config()

const getRegistrations = require('./services/eduweb')
const hasOodiEntry = require('./services/oodikone')
const getCompletions = require('./services/pointsmooc')

const courseCodes = ['AYTKT21018']

const script = async (course) => {
  try {
    //const registrations = await getRegistrations(course)
    const completions = await getCompletions(course)
    console.log(completions)
    /* console.log(
      'Has oodi mark: ',
      await hasOodiEntry('014822795', courseCodes[0])
    ) */
  } catch (error) {
    console.log('Error:', error.message)
  }
}

courseCodes.forEach((course) => {
  script(course)
})
