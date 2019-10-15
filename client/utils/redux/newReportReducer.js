import { attachRegistrations, stripRegistrations } from 'Utilities/inputParser'
const moment = require('moment')

import callBuilder from '../apiConnection'

export const setNewReportAction = (report) => {
  return { type: 'SET_NEW_REPORT', payload: report }
}

export const sendNewReportAction = (report) => {
  const route = `/reports`
  const prefix = 'POST_REPORT'
  return callBuilder(route, prefix, 'post', {
    ...report,
    rawData: undefined,
    sending: undefined
  })
}

// Reducer
// You can include more app wide actions such as "selected: []" into the state
export default (state = null, action) => {
  switch (action.type) {
    case 'SET_NEW_REPORT':
      return action.payload
    case 'POST_REPORT_ATTEMPT':
      return {
        ...state,
        sending: true
      }
    case 'POST_REPORT_SUCCESS':
      return {
        ...state,
        data: null,
        courseId: null,
        date: moment().format('D.M.YYYY'),
        sending: false,
        rawData: ''
      }
    case 'POST_REPORT_FAILURE':
      return {
        ...state,
        sending: false
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
        date: moment().format('D.M.YYYY'),
        sending: false,
        rawData: ''
      }
    default:
      return state
  }
}
