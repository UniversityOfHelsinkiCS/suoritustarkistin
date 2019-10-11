import callBuilder from '../apiConnection'
/**
 * Actions and reducers are in the same file for readability
 */

export const getCoursesRegistrationsAction = (id) => {
  const route = `/courses/${id}/registrations`
  const prefix = 'GET_REGISTRATIONS'
  return callBuilder(route, prefix, 'get')
}

export const clearRegistrationsAction = () => {
  return { type: 'CLEAR_REGISTRATIONS' }
}

// Reducer
// You can include more app wide actions such as "selected: []" into the state
export default (state = { data: [] }, action) => {
  switch (action.type) {
    case 'GET_REGISTRATIONS_SUCCESS':
      return {
        ...state,
        data: action.response,
        pending: false,
        error: false
      }
    case 'GET_REGISTRATIONS_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'GET_REGISTRATIONS_FAILURE':
      return {
        ...state,
        data: [],
        pending: false,
        error: true
      }
    case 'CLEAR_REGISTRATIONS':
      return {
        ...state,
        data: [],
        pending: false,
        error: false
      }
    default:
      return state
  }
}
