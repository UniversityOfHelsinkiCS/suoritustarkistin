import callBuilder from '../apiConnection'
/**
 * Actions and reducers are in the same file for readability
 */

export const getAllReportsAction = () => {
  const route = '/reports'
  const prefix = 'GET_ALL_REPORTS'
  return callBuilder(route, prefix, 'get')
}

export const getUsersReportsAction = () => {
  const route = '/logout'
  const prefix = 'GET_USERS_REPORTS'
  return callBuilder(route, prefix, 'get')
}

// Reducer
// You can include more app wide actions such as "selected: []" into the state
export default (state = { data: null }, action) => {
  switch (action.type) {
    case 'GET_ALL_REPORTS_SUCCESS':
      return {
        ...state,
        data: action.response,
        pending: false,
        error: false
      }
    case 'GET_USERS_REPORTS_SUCCESS':
      return {
        ...state,
        data: action.response,
        pending: false,
        error: false
      }
    default:
      return state
  }
}
