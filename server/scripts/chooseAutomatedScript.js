const {
  NEW_EOAI_CODE,
  NEW_BAI_INTERMEDIATE_CODE,
  NEW_BAI_ADVANCED_CODE
} = require('@root/utils/common')
const { processNewEoaiEntries } = require('../scripts/processNewEoaiEntries')
const { processNewBaiIntermediateEntries } = require('../scripts/processNewBaiIntermediateEntries')
const { processNewBaiAdvancedEntries } = require('../scripts/processNewBaiAdvancedEntries')
const { processMoocEntries } = require('../scripts/processMoocEntries')

const chooseScript = (courseCode) => {
  if (NEW_EOAI_CODE === courseCode) return processNewEoaiEntries
  if (NEW_BAI_INTERMEDIATE_CODE === courseCode) return processNewBaiIntermediateEntries
  if (NEW_BAI_ADVANCED_CODE === courseCode) return processNewBaiAdvancedEntries
  return processMoocEntries
}

module.exports = {
  chooseScript
}