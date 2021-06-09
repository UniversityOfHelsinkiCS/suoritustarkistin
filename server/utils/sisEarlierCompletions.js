const moment = require("moment")

/**
 * Return true if given grade is valid for student. That is, the student does not
 * already have a higher grade for the course, or for it's substitutions.
**/
const isImprovedGrade = (allEarlierAttainments, studentNumber, grade, newDate) => {
  if (!allEarlierAttainments) return true
  const student = allEarlierAttainments.find((a) => a.studentNumber === studentNumber)
  const earlierAttainments = student ? student.attainments : undefined
  if (!earlierAttainments) return true

  const formattedDate = moment(newDate).format('YYYY-MM-DD')

  if ([0,1,2,3,4,5].includes(Number(grade))) {
    // If the grade is better, no matter the date, the credits are given
    const existingBetterGrade = earlierAttainments.some((a) => a.grade.numericCorrespondence > Number(grade) && !a.misregistration)

    // If the grade is the same, but date is older than some other attainment, no new credits are given
    const existingNewerDate = earlierAttainments.some((a) => {
      return a.grade.numericCorrespondence === Number(grade) && (moment(a.attainmentDate).format('YYYY-MM-DD') >= formattedDate) && !a.misregistration
    })
    let newerFailed = false

    // If the grade is 0, there is no numeric correspondence, so checking needs to be done with the passed-attribute
    if (Number(grade) === 0) {
      newerFailed = earlierAttainments.some((a) => !a.grade.passed && (moment(a.attainmentDate).format('YYYY-MM-DD') >= formattedDate) && !a.misregistration)
    }
    if (existingBetterGrade || existingNewerDate || newerFailed) return false
  }

  if (['Hyl.', 'Hyv.'].includes(grade)) {
    // If the grade is the same, but date is older than some other attainment, no new credits are given
    const existingPassedAttainment = earlierAttainments.some((a) => a.grade.passed && (moment(a.attainmentDate).format('YYYY-MM-DD') >= formattedDate) && !a.misregistration)

    let newerFailed = false
    if (grade === "Hyl.") {
      newerFailed = earlierAttainments.some((a) => !a.grade.passed && (moment(a.attainmentDate).format('YYYY-MM-DD') >= formattedDate) && !a.misregistration)
    }
    if (existingPassedAttainment || newerFailed) return false
  }

  return true
}

const earlierBaiCompletionFound = (allEarlierAttainments, studentNumber, newDate) => {
  if (!allEarlierAttainments) return false
  const studentsAttainments = allEarlierAttainments.filter((a) => a.studentNumber === studentNumber)

  // Map student's earlier attainments for old and new intermediate BAI
  const earlierAttainments = studentsAttainments.length
    ? studentsAttainments.reduce((attainments, pair) => attainments.concat(pair.attainments), [])
    : undefined

  // No earlier completions for old or new BAI, Intermediate can be given
  if (!earlierAttainments) return false

  const formattedDate = moment(newDate).format('YYYY-MM-DD')

  // Intermediate level already completed, no Intermediate credit can be given
  if (earlierAttainments.some(
    (a) =>
      Number(a.credits) >= 1
      && (moment(a.attainmentDate).format('YYYY-MM-DD') >= formattedDate)
      && a.grade.passed
      && !a.misregistration
    )
  ) return true
  
  return false
}

const advancedFound = (advancedAttainments, oldBaiAttainments, studentNumber, newDate) => {
  const advancedStudent = advancedAttainments.find((a) => a.studentNumber === studentNumber)
  const earlierAdvancedAttainments = advancedStudent ? advancedStudent.attainments : undefined

  const formattedDate = moment(newDate).format('YYYY-MM-DD')

  // Earlier completion for Advanced course, no credit can be given
  if (earlierAdvancedAttainments && earlierAdvancedAttainments.some(
    (a) =>
      a.grade.passed
      && (moment(a.attainmentDate).format('YYYY-MM-DD') >= formattedDate)
      && a.credits >= 1
      && !a.misregistration
    )
  ) return true

  const baiStudent = oldBaiAttainments.find((a) => a.studentNumber === studentNumber)
  const earlierBaiAttainments = baiStudent ? baiStudent.attainments : undefined

  // Earlier 2 credit completion for old Building AI -course, no new credits can be given
  if (earlierBaiAttainments && earlierBaiAttainments.some(
    (a) =>
      a.grade.passed
      && (moment(a.attainmentDate).format('YYYY-MM-DD') >= formattedDate)
      && a.credits >= 2
      && !a.misregistration
    )
  ) return true

  return false
}

module.exports = { isImprovedGrade, earlierBaiCompletionFound, advancedFound }