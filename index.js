require('dotenv').config()

const getRegistrations = require('./services/eduweb')
const hasOodiEntry = require('./services/oodikone')
const getCompletions = require('./services/pointsmooc')
const db = require('./models/index')
const fs = require('fs')

const courseCodes = ['AYTKT21018']

const script = async (course) => {
  try {
    const credits = await db.credits.findAll({ raw: true })
    const moocIdsInDb = credits.map((credit) => credit.moocId)
    const studentIdsInDb = credits.map((credit) => credit.studentId)
    //console.log('moocId:', moocIdsInDb)
    //console.log('studentId:', studentIdsInDb)

    const registrations = await getRegistrations(course)
    const completions = await getCompletions(course)
    //console.log('registration:', registrations[0])
    //console.log('completion:', completions[0])
    const filteredRegistrations = registrations.filter(
      (registration) => !studentIdsInDb.includes(registration.onro)
    )
    console.log('Filtered registrations:', filteredRegistrations.length)
    const filteredCompletions = completions.filter(
      (completion) => !moocIdsInDb.includes(completion.id)
    )
    console.log('Filtered completions:', filteredCompletions.length)

    console.log('starting matching')
    let matchesFi = []
    let matchesEn = []
    for (const registration of filteredRegistrations) {
      for (const completion of filteredCompletions) {
        if (
          completion.email === registration.email ||
          completion.email === registration.mooc
        ) {
          const { id, completion_language, ...rest } = completion
          if (completion_language === 'fi_fi') {
            matchesFi = matchesFi.concat({
              ...rest,
              moocId: id,
              studentId: registration.onro,
              courseId: course
            })
          } else if (completion_language === 'en_us') {
            matchesEn = matchesEn.concat({
              ...rest,
              moocId: id,
              studentId: registration.onro,
              courseId: course
            })
          }
        }
      }
    }
    console.log(
      `Found ${matchesFi.length} matches for finnish course ${course}.`
    )

    console.log(
      `Found ${matchesEn.length} matches for english course ${course}.`
    )
    const dateNow =  new Date()

    const date = `${dateNow.getDate()}.${dateNow.getMonth() + 1}.${dateNow.getFullYear()}`
    const shortDate = `${dateNow.getDate()}.${dateNow.getMonth() + 1}.${dateNow.getYear()}`
    
    const reportEn = matchesEn.map((entry) => 
      `${entry.studentId}##6#AYTKT21018#The Elements of AI#${date}#0#Hyv.#106##${TEACHERCODE}#1#H930#11#93013#3##2,0`
    ).join('\n')

    const reportFi = matchesFi.map((entry) => 
      `${entry.studentId}##1#AYTKT21018fi#Elements of AI: Tekoälyn perusteet#${date}#0#Hyv.#106##${TEACHERCODE}$#1#H930#11#93013#3##2,0`
    ).join('\n')

    fs.writeFile(`reports/AYTKT21018%${shortDate}-V1-S2019.dat`, reportEn, (err) => {
      if (err) throw err;
    });

    fs.writeFile(`reports/AYTKT21018fi%${shortDate}-V1-S2019.dat`, reportFi, (err) => {
      if (err) throw err;
    });

    /*     console.log('Example: ', matches[0])
    console.log(
      'Example has oodi entry:',
      await hasOodiEntry(matches[0].studentId, course)
    ) */
  } catch (error) {
    console.log('Error:', error.message)
  }
}


courseCodes.forEach((course) => {
  script(course)
})
