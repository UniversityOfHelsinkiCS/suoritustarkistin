import { attachRegistrations, stripRegistrations } from 'Utilities/inputParser'
import callBuilder from '../apiConnection'


const initialState = {
  rawData: '',
  data: null, 
  courseId: null,
  defaultGrade: false,
  date: new Date()
}

export const setNewRawEntriesAction = (rawEntries) => {
  return { type: 'SET_NEW_RAW_ENTRIES', payload: rawEntries }
}

export const sendNewRawEntriesAction = (rawEntries) => {
  const route = `/sis_raw_entries`
  const prefix = 'POST_RAW_ENTRIES'
  return callBuilder(route, prefix, 'post', {
    ...rawEntries,
    rawData: undefined,
    sending: undefined
  })
}

// Reducer
// You can include more app wide actions such as "selected: []" into the state
export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_NEW_RAW_ENTRIES':
      return action.payload
    case 'POST_RAW_ENTRIES_ATTEMPT':
      return {
        ...state,
        sending: true
      }
    case 'POST_RAW_ENTRIES_SUCCESS':
      return {
        ...state,
        data: null,
        courseId: null,
        sending: false,
        defaultGrade: false,
        rawData: '',
        error: ''
      }
    case 'POST_RAW_ENTRIES_FAILURE':
      return {
        ...state,
        sending: false,
        error: action.error.message,
        failed: action.error.failed
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
        defaultGrade: false,
        graderId: action.response.employeeId,
        data: null,
        sending: false,
        rawData: ''
      }
    default:
      return state
  }
}