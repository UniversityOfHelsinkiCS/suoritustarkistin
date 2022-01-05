import callBuilder from '../apiConnection'


const initialState = {
  rawData: '',
  data: null,
  courseId: null,
  graderId: '',
  defaultGrade: false,
  defaultCourse: '',
  date: new Date(),
  sending: false,
  entriesToConfirm: {}
}

export const setNewRawEntriesAction = (rawEntries) => {
  return { type: 'SET_NEW_RAW_ENTRIES', payload: rawEntries }
}

export const resetNewRawEntriesAction = () => ({
  type: 'SET_NEW_RAW_ENTRIES', payload: { ...initialState }
})

export const resetNewRawEntriesConfirmAction = () => ({
  type: 'RESET_NEW_RAW_ENTRIES_CONFIRM'
})

export const sendNewRawEntriesAction = (rawEntries) => {
  const route = `/sis_raw_entries`
  const prefix = 'POST_RAW_ENTRIES'
  return callBuilder(route, prefix, 'post', {
    ...rawEntries
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
        sending: false,
        error: null,
        entriesToConfirm: action.response
      }
    case 'POST_RAW_ENTRIES_FAILURE':
      return {
        ...state,
        sending: false,
        error: action.error.message,
        failed: action.error.failed
      }
    case 'RESET_NEW_RAW_ENTRIES_CONFIRM':
      return {
        ...state,
        sending: false,
        error: null,
        entriesToConfirm: {}
      }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        graderId: action.response.employeeId
      }
    default:
      return state
  }
}