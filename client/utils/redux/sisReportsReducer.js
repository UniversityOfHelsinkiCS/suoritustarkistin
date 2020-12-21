import callBuilder from '../apiConnection'
/**
 * Actions and reducers are in the same file for readability
 */

export const sisGetAllReportsAction = () => {
  const route = '/sis_reports'
  const prefix = 'SIS_GET_ALL_REPORTS'
  return callBuilder(route, prefix, 'get')
}

export const sisGetUsersReportsAction = (id) => {
  const route = `/users/${id}/sis_reports`
  const prefix = 'SIS_GET_USERS_REPORTS'
  return callBuilder(route, prefix, 'get')
}

// Reducer
// You can include more app wide actions such as "selected: []" into the state
export default (state = { data: [] }, action) => {
  switch (action.type) {
    case 'SIS_GET_ALL_REPORTS_SUCCESS':
      return {
        ...state,
        data: action.response,
        pending: false,
        error: false
      }
    case 'SIS_GET_ALL_REPORTS_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'SIS_GET_ALL_REPORTS_FAILURE':
      return {
        ...state,
        data: [],
        pending: false,
        error: true
      }
    case 'SIS_GET_USERS_REPORTS_SUCCESS':
      return {
        ...state,
        data: action.response,
        pending: false,
        error: false
      }
    case 'SIS_GET_USERS_REPORTS_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'SIS_GET_USERS_REPORTS_FAILURE':
      return {
        ...state,
        data: [],
        pending: false,
        error: true
      }
    default:
      return state
  }
}
