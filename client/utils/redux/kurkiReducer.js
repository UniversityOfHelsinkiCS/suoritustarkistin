import callBuilder from '../apiConnection'
/**
 * Actions and reducers are in the same file for readability
 */

const initialState = {
  courses: []
}

export const getKurkiCoursesAction = () => {
  const route = '/kurki/courses'
  const prefix = 'GET_ALL_KURKI_COURSES'
  return callBuilder(route, prefix, 'get')
}

export const addKurkiRawEntriesAction = (kurkiCourse) => {
  const route = '/kurki/raw_entries'
  const prefix = 'CREATE_REPORT_ACTION'
  return callBuilder(route, prefix, 'post', { kurkiCourse })
}

// Reducer
// You can include more app wide actions such as "selected: []" into the state
export default (state = initialState, action) => {
  switch (action.type) {
    case 'GET_ALL_KURKI_COURSES_SUCCESS':
      return {
        ...state,
        courses: action.response,
        pending: false,
        error: false
      }
    case 'GET_ALL_KURKI_COURSES_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'GET_ALL_KURKI_COURSES_FAILURE':
      return {
        ...state,
        courses: [],
        pending: false,
        error: true
      }
    case 'CREATE_KURKI_REPORT_SUCCESS':
      return {
        ...state,
        pending: false,
        error: false
      }
    case 'CREATE_KURKI_REPORT_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'CREATE_KURKI_REPORT_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    default:
      return state
  }
}