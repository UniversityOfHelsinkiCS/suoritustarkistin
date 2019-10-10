import { combineReducers } from 'redux'

import user from './userReducer'
import reports from './reportsReducer'
import courses from './coursesReducer'
import graders from './gradersReducer'
import registrations from './registrationsReducer'

export default combineReducers({
  user,
  reports,
  courses,
  graders,
  registrations
})
