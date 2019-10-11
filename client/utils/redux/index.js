import { combineReducers } from 'redux'

import user from './userReducer'
import reports from './reportsReducer'
import courses from './coursesReducer'
import graders from './gradersReducer'
import registrations from './registrationsReducer'
import newReport from './newReportReducer'

export default combineReducers({
  user,
  reports,
  courses,
  graders,
  registrations,
  newReport
})
