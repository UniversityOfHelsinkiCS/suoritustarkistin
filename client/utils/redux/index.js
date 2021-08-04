import { combineReducers } from 'redux'

import user from './userReducer'
import oodiReports from './oodiReportsReducer'
import sisReports from './sisReportsReducer'
import courses from './coursesReducer'
import graders from './gradersReducer'
import registrations from './registrationsReducer'
import newRawEntries from './newRawEntriesReducer'
import newEntries from './newEntriesReducer'
import kurki from './kurkiReducer'
import message from './messageReducer'
import users from './usersReducer'
import moocJobs from './moocJobsReducer'
import systemStatus from './systemStatusReducer'

export default combineReducers({
  user,
  oodiReports,
  sisReports,
  courses,
  graders,
  registrations,
  newRawEntries,
  newEntries,
  kurki,
  message,
  users,
  moocJobs,
  systemStatus
})
