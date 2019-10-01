import { combineReducers } from 'redux'

import user from './userReducer'
import reports from './reportsReducer'

export default combineReducers({
  user,
  reports
})
