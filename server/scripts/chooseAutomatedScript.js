const {
  NEW_EOAI_CODE,
  NEW_BAI_INTERMEDIATE_CODE,
  NEW_BAI_ADVANCED_CODE,
  NEW_MOOC_COURSES
} = require('@root/utils/common')
const { processEoaiEntries } = require('./processEoaiEntries')
const { processBaiIntermediateEntries } = require('./processBaiIntermediateEntries')
const { processBaiAdvancedEntries } = require('./processBaiAdvancedEntries')
const { processMoocEntries } = require('./processMoocEntries')
const { processNewMoocEntries } = require('./processNewMoocEntries')

const chooseScript = (courseCode) => {
  if (NEW_EOAI_CODE === courseCode) return processEoaiEntries
  if (NEW_BAI_INTERMEDIATE_CODE === courseCode) return processBaiIntermediateEntries
  if (NEW_BAI_ADVANCED_CODE === courseCode) return processBaiAdvancedEntries
  if (NEW_MOOC_COURSES.includes(courseCode)) return processNewMoocEntries
  return processMoocEntries
}

module.exports = {
  chooseScript
}
