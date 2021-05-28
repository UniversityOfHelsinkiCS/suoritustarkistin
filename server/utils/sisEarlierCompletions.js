/**
 * Return true if given grade is valid for student. That is, the student does not
 * already have a higher grade for the course, or for it's substitutions.
**/
const isImprovedGrade = (allEarlierAttainments, studentNumber, grade) => {
  if (!allEarlierAttainments) return true
  const student = allEarlierAttainments.find((a) => a.studentNumber === studentNumber)
  const earlierAttainments = student ? student.attainments : undefined
  if (!earlierAttainments) return true

  if ([0,1,2,3,4,5].includes(Number(grade))) {
    const existingBetterGrade = earlierAttainments.some((attainment) => attainment.grade.numericCorrespondence >= Number(grade))
    if (existingBetterGrade) return false
  }

  if (['Hyl.', 'Hyv.'].includes(grade)) {
    const existingPassedAttainment = earlierAttainments.some((attainment) => attainment.grade.passed)
    if (existingPassedAttainment) return false
  }

  return true
}

const earlierBaiCompletionFound = (allEarlierAttainments, studentNumber) => {
  if (!allEarlierAttainments) return false
  const studentsAttainments = allEarlierAttainments.filter((a) => a.studentNumber === studentNumber)

  // Map student's earlier attainments for old and new intermediate BAI
  const earlierAttainments = studentsAttainments.length
    ? studentsAttainments.reduce((attainments, pair) => attainments.concat(pair.attainments), [])
    : undefined

  // No earlier completions for old or new BAI, Intermediate can be given
  if (!earlierAttainments) return false

  // Intermediate level already completed, no Intermediate credit can be given
  if (earlierAttainments.some((a) => Number(a.credits) >= 1 && a.grade.passed)) {
    return true
  }

  return false
}

const intermediateFound = (allEarlierAttainments, studentNumber) => {
  const studentsAttainments = allEarlierAttainments.filter((a) => a.studentNumber === studentNumber)

  // Map student's earlier attainments for old and new BAI
  const earlierAttainments = studentsAttainments.length
    ? studentsAttainments.reduce((attainments, pair) => attainments.concat(pair.attainments), [])
    : undefined

  // No earlier completions for BAI, so Advanced credit cannot be given.
  if (!earlierAttainments) return false
  
  // Earlier completion with 2 credits from BAI, i.e. course fully completed, no Advanced credit should be given
  if (earlierAttainments.some((a) => Number(a.credits) >= 2)) return false

  // Earlier completion with 1 credits correctly from new or old BAI, Advanced credit can be given
  if (earlierAttainments.some((a) => a.grade.passed && a.credits === 1)) return true

  return false
}

const advancedFound = (advancedAttainments, oldBaiAttainments, studentNumber) => {
  const advancedStudent = advancedAttainments.find((a) => a.studentNumber === studentNumber)
  const earlierAdvancedAttainments = advancedStudent ? advancedStudent.attainments : undefined

  // Earlier completion for Advanced course, no credit can be given
  if (earlierAdvancedAttainments && earlierAdvancedAttainments.some((a) => a.grade.passed && a.credits >= 1)) return true

  const baiStudent = oldBaiAttainments.find((a) => a.studentNumber === studentNumber)
  const earlierBaiAttainments = baiStudent ? baiStudent.attainments : undefined

  // Earlier 2 credit completion for old Building AI -course, no new credits can be given
  if (earlierBaiAttainments && earlierBaiAttainments.some((a) => a.grade.passed && a.credits >= 2)) return true

  return false
}

module.exports = { isImprovedGrade, earlierBaiCompletionFound, intermediateFound, advancedFound }