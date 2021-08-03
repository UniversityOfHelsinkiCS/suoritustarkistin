import { combineReducers } from 'redux'

import user from './userReducer'
import reports from './reportsReducer'
import sisReports from './sisReportsReducer'
import courses from './coursesReducer'
import graders from './gradersReducer'
import registrations from './registrationsReducer'
import newRawEntries from './sisNewRawEntriesReducer'
import newEntries from './sisNewEntriesReducer'
import kurki from './kurkiReducer'
import message from './messageReducer'
import users from './usersReducer'
import moocJobs from './moocJobsReducer'
import systemStatus from './systemStatusReducer'

export default combineReducers({
  user,
  reports,
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
