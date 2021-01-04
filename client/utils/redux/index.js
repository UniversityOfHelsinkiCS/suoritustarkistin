import { combineReducers } from 'redux'

import user from './userReducer'
import reports from './reportsReducer'
import sisReports from './sisReportsReducer'
import courses from './coursesReducer'
import graders from './gradersReducer'
import registrations from './registrationsReducer'
import newReport from './newReportReducer'
import newRawEntries from './sisNewRawEntriesReducer'
import newEntries from './sisNewEntriesReducer'
import message from './messageReducer'
import users from './usersReducer'
import jobs from './jobsReducer'

export default combineReducers({
  user,
  reports,
  sisReports,
  courses,
  graders,
  registrations,
  newReport,
  newRawEntries,
  newEntries,
  message,
  users,
  jobs
})
