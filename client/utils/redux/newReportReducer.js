import { attachRegistrations, stripRegistrations } from 'Utilities/inputParser'
const moment = require('moment')

export const setNewReportAction = (report) => {
  return { type: 'SET_NEW_REPORT', payload: report }
}

export const clearNewReportAction = () => {
  return { type: 'CLEAR_NEW_REPORT' }
}

// Reducer
// You can include more app wide actions such as "selected: []" into the state
export default (state = null, action) => {
  switch (action.type) {
    case 'SET_NEW_REPORT':
      return action.payload
    case 'CLEAR_NEW_REPORT':
      return {
        ...state,
        data: null,
        courseId: null,
        date: moment().format('D.M.YYYY')
      }
    case 'GET_REGISTRATIONS_SUCCESS':
      return {
        ...state,
        data: attachRegistrations(state.data, action.response)
      }
    case 'CLEAR_REGISTRATIONS':
      return {
        ...state,
        data: stripRegistrations(state.data)
      }
    case 'LOGIN_SUCCESS':
      return {
        courseId: null,
        graderEmployeeId: action.response.employeeId,
        data: null,
        date: moment().format('D.M.YYYY')
      }
    default:
      return state
  }
}
