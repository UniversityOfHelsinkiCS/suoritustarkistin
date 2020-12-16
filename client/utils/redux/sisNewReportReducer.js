import { attachRegistrations, stripRegistrations } from 'Utilities/inputParser'
const moment = require('moment')

import callBuilder from '../apiConnection'


const initialState = {
  rawData: '',
  data: null, 
  courseId: null,
  date: moment().format('D.M.YYYY')
}

export const sisSetNewReportAction = (report) => {
  return { type: 'SIS_SET_NEW_REPORT', payload: report }
}

export const sisSendNewReportAction = (report) => {
  const route = `/sis_reports`
  const prefix = 'POST_REPORT'
  return callBuilder(route, prefix, 'post', {
    ...report,
    rawData: undefined,
    sending: undefined
  })
}

// Reducer
// You can include more app wide actions such as "selected: []" into the state
export default (state = initialState, action) => {
  switch (action.type) {
    case 'SIS_SET_NEW_REPORT':
      return action.payload
    case 'SIS_POST_REPORT_ATTEMPT':
      return {
        ...state,
        sending: true
      }
    case 'SIS_POST_REPORT_SUCCESS':
      return {
        ...state,
        data: null,
        courseId: null,
        date: moment().format('D.M.YYYY'),
        sending: false,
        rawData: ''
      }
    case 'SIS_POST_REPORT_FAILURE':
      return {
        ...state,
        sending: false
      }
    case 'SIS_GET_REGISTRATIONS_SUCCESS':
      return {
        ...state,
        data: attachRegistrations(state.data, action.response)
      }
    case 'SIS_CLEAR_REGISTRATIONS':
      return {
        ...state,
        data: stripRegistrations(state.data)
      }
    case 'SIS_LOGIN_SUCCESS':
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