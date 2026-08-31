import { combineReducers } from 'redux'

import apiChecks from './apiCheckReducer'
import apiKeys from './apiKeysReducer'
import courses from './coursesReducer'
import graders from './gradersReducer'
import message from './messageReducer'
import moocJobs from './moocJobsReducer'
import newEntries from './newEntriesReducer'
import newRawEntries from './newRawEntriesReducer'
import oodiReports from './oodiReportsReducer'
import sisReports from './sisReportsReducer'
import systemStatus from './systemStatusReducer'
import user from './userReducer'
import users from './usersReducer'

export default combineReducers({
  user,
  oodiReports,
  sisReports,
  courses,
  graders,
  newRawEntries,
  newEntries,
  message,
  users,
  moocJobs,
  systemStatus,
  apiChecks,
  apiKeys
})
