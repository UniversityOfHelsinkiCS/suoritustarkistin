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
  entriesToConfirm: {},
  importStudents: {
    data: []
  },
  importStudentsAttainments: {
    data: [],
    pending: true
  }
}

export const setNewRawEntriesAction = (rawEntries) => {
  return { type: 'SET_NEW_RAW_ENTRIES', payload: rawEntries }
}

export const resetNewRawEntriesAction = (graderId = '') => ({
  type: 'SET_NEW_RAW_ENTRIES', payload: { ...initialState, graderId }
})

export const resetNewRawEntriesConfirmAction = () => ({
  type: 'RESET_NEW_RAW_ENTRIES_CONFIRM'
})

export const importStudentsAction = (courseCode) => {
  const route = `/import-students/${courseCode}`
  const prefix = 'IMPORT_STUDENTS'
  return callBuilder(route, prefix, 'get')
}

export const importStudentsAttainments = (data) => {
  const route = '/import-students/attainments'
  const prefix = 'IMPORT_STUDENTS_ATTAINMENTS'
  return callBuilder(route, prefix, 'post', data)
}

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
    case 'IMPORT_STUDENTS_ATTEMPT':
      return {
        ...state,
        importStudents: {
          ...state.importStudents,
          pending: true,
          error: false
        }
      }
    case 'IMPORT_STUDENTS_FAILURE':
      return {
        ...state,
        importStudents: {
          ...state.importStudents,
          pending: false,
          error: action.response || true
        }
      }
    case 'IMPORT_STUDENTS_SUCCESS':
      return {
        ...state,
        importStudents: {
          ...state.importStudents,
          data: action.response,
          pending: false,
          error: false
        }
      }
    case 'IMPORT_STUDENTS_ATTAINMENTS_ATTEMPT':
      return {
        ...state,
        importStudentsAttainments: {
          ...state.importStudentsAttainments,
          pending: true,
          error: false
        }
      }
    case 'IMPORT_STUDENTS_ATTAINMENTS_FAILURE':
      return {
        ...state,
        importStudentsAttainments: {
          ...state.importStudentsAttainments,
          pending: false,
          error: action.response || true
        }
      }
    case 'IMPORT_STUDENTS_ATTAINMENTS_SUCCESS': {
      const oldStudents = state.importStudentsAttainments.data.map(({ studentNumber }) => studentNumber)
      const newStudents = action.response.filter((s) => !oldStudents.includes(s.studentNumber))
      return {
        ...state,
        importStudentsAttainments: {
          ...state.importStudentsAttainments,
          data: state.importStudentsAttainments.data.concat(newStudents),
          pending: false,
          error: false
        }
      }
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
