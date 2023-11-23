const moment = require('moment')

const checkNumericImprovement = (earlierAttainments, grade, completionDate, credits) => {
  const completionDateMoment = moment(completionDate)

  if (earlierAttainments.some((a) => a.grade.numericCorrespondence < grade)) return true

  if (earlierAttainments.some((a) => a.grade.numericCorrespondence === grade && Number(a.credits) < credits))
    return true

  // Same grade and credits but greater completion date
  if (
    earlierAttainments
      .filter((a) => a.grade.numericCorrespondence === grade && Number(a.credits) === credits)
      .every((a) => completionDateMoment.isAfter(moment(a.attainmentDate), 'day'))
  )
    return true

  return false
}

const checkPassed = (earlierAttainments, completionDate, credits) => {
  const completionDateMoment = moment(completionDate)

  if (earlierAttainments.every((a) => !a.grade.passed)) return true

  // Passed and new mark has greater credits
  if (earlierAttainments.filter((a) => a.grade.passed).every((a) => Number(a.credits) < credits)) return true

  // Passed with same credits but greater completion date
  if (
    earlierAttainments
      .filter((a) => a.grade.passed && Number(a.credits) === credits)
      .every((a) => completionDateMoment.isAfter(moment(a.attainmentDate), 'day'))
  )
    return true

  return false
}

const checkFailed = (earlierAttainments, completionDate, credits) => {
  const completionDateMoment = moment(completionDate)
  if (earlierAttainments.some((a) => a.grade.passed)) return false

  // Failed and new mark has greater credits
  if (earlierAttainments.filter((a) => !a.grade.passed).every((a) => Number(a.credits) < credits)) return true

  // Failed with same credits but greater completion date
  if (
    earlierAttainments
      .filter((a) => !a.grade.passed && Number(a.credits) === credits)
      .every((a) => completionDateMoment.isAfter(moment(a.attainmentDate), 'day'))
  )
    return true

  return false
}

/**
 * Return true if given grade is valid for student. That is any of:
 *  1. Given grade is better than grade in earlier attainments
 *  2. Given grade is same with greater credits than grade in earlier attainments
 *  3. Given grade and credits is same with greater completion date than grade in earlier attainments
 *  4. Given grade is exactly same as than grade in earlier attainments :wat:
 */
const isImprovedGrade = (allEarlierAttainments, studentNumber, grade, completionDate, credits) => {
  if (!allEarlierAttainments) return true
  if (!grade) return false
  const student = allEarlierAttainments.find((a) => a.studentNumber === studentNumber)
  const earlierAttainments = student ? student.attainments.filter((a) => !a.misregistration) : undefined
  if (!earlierAttainments || !earlierAttainments.length) return true

  const sanitizedCredits = Number(credits.replace(',', '.'))
  const sanitizedGrade = Number(grade.replace(',', '.'))
  if (sanitizedGrade >= 1 && sanitizedGrade <= 5)
    return checkNumericImprovement(earlierAttainments, sanitizedGrade, completionDate, sanitizedCredits)

  if (grade === 'Hyv.') return checkPassed(earlierAttainments, completionDate, sanitizedCredits)

  return checkFailed(earlierAttainments, completionDate, sanitizedCredits)
}

const isSameGrade = (a, grade) => {
  const sanitizedGrade = Number(grade.replace(',', '.'))

  if (sanitizedGrade >= 1 && sanitizedGrade <= 5) return a.grade.numericCorrespondence === sanitizedGrade
  if (grade === 'Pass' || grade === 'Hyv.' || grade === 'G') return a.grade.name.en === 'Pass'
  return !a.grade.passed
}

const identicalCompletionFound = (allEarlierAttainments, studentNumber, courseCode, grade, attainmentDate, credits) => {
  if (!allEarlierAttainments) return false
  if (!grade) return false
  const student = allEarlierAttainments.find((a) => a.studentNumber === studentNumber && a.courseCode === courseCode)
  const earlierAttainments = student ? student.attainments.filter((a) => !a.misregistration) : undefined
  if (!earlierAttainments || !earlierAttainments.length) return false

  const sanitizedCredits = Number(credits.replace(',', '.'))
  const sanitizedDate = new Date(attainmentDate).setHours(0, 0, 0)

  return earlierAttainments.some(
    (a) =>
      isSameGrade(a, grade) &&
      new Date(a.attainmentDate).getTime() === new Date(sanitizedDate).getTime() &&
      a.credits === sanitizedCredits
  )
}

const earlierBaiCompletionFound = (allEarlierAttainments, studentNumber, completionDate) => {
  if (!allEarlierAttainments) return false
  const studentsAttainments = allEarlierAttainments.filter((a) => a.studentNumber === studentNumber)

  // Map student's earlier attainments for old and new intermediate BAI
  const earlierAttainments =
    studentsAttainments && studentsAttainments.length
      ? studentsAttainments.reduce((attainments, pair) => attainments.concat(pair.attainments), [])
      : undefined

  // No earlier completions for old or new BAI, Intermediate can be given
  if (!earlierAttainments) return false

  const formattedDate = moment(completionDate).format('YYYY-MM-DD')

  // Intermediate level already completed, no Intermediate credit can be given
  if (
    earlierAttainments.some(
      (a) =>
        Number(a.credits) >= 1 &&
        moment(a.attainmentDate).format('YYYY-MM-DD') >= formattedDate &&
        a.grade.passed &&
        !a.misregistration
    )
  )
    return true

  return false
}

const advancedFound = (advancedAttainments, oldBaiAttainments, studentNumber, completionDate) => {
  const advancedStudent = advancedAttainments.find((a) => a.studentNumber === studentNumber)
  const earlierAdvancedAttainments = advancedStudent ? advancedStudent.attainments : undefined

  const formattedDate = moment(completionDate).format('YYYY-MM-DD')

  // Earlier completion for Advanced course, no credit can be given
  if (
    earlierAdvancedAttainments &&
    earlierAdvancedAttainments.some(
      (a) =>
        a.grade.passed &&
        moment(a.attainmentDate).format('YYYY-MM-DD') >= formattedDate &&
        a.credits >= 1 &&
        !a.misregistration
    )
  )
    return true

  const baiStudent = oldBaiAttainments.find((a) => a.studentNumber === studentNumber)
  const earlierBaiAttainments = baiStudent ? baiStudent.attainments : undefined

  // Earlier 2 credit completion for old Building AI -course, no new credits can be given
  if (
    earlierBaiAttainments &&
    earlierBaiAttainments.some(
      (a) =>
        a.grade.passed &&
        moment(a.attainmentDate).format('YYYY-MM-DD') >= formattedDate &&
        a.credits >= 2 &&
        !a.misregistration
    )
  )
    return true

  return false
}

const filterDuplicateMatches = (matches) => {
  const uniqueMatches = []
  matches.forEach((match) => {
    if (!uniqueMatches.some((m) => m.studentNumber === match.studentNumber && m.courseId === match.courseId)) {
      uniqueMatches.push(match)
    }
  })

  return uniqueMatches
}

module.exports = { isImprovedGrade, identicalCompletionFound, earlierBaiCompletionFound, advancedFound, filterDuplicateMatches }
