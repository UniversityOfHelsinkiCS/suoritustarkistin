import callBuilder from '../apiConnection'
/**
 * Actions and reducers are in the same file for readability
 */

export const getAllGradersAction = () => {
  const route = '/users/graders'
  const prefix = 'GET_ALL_GRADERS'
  return callBuilder(route, prefix, 'get')
}

export const getUsersGradersAction = (id) => {
  const route = `/users/${id}/graders`
  const prefix = 'GET_USERS_GRADERS'
  return callBuilder(route, prefix, 'get')
}

// Reducer
// You can include more app wide actions such as "selected: []" into the state
export default (state = { data: [] }, action) => {
  switch (action.type) {
    case 'GET_ALL_GRADERS_SUCCESS':
      return {
        ...state,
        data: action.response,
        pending: false,
        error: false
      }
    case 'GET_ALL_GRADERS_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'GET_ALL_GRADERS_FAILURE':
      return {
        ...state,
        data: [],
        pending: false,
        error: true
      }
    case 'GET_USERS_GRADERS_SUCCESS':
      return {
        ...state,
        data: action.response,
        pending: false,
        error: false
      }
    case 'GET_USERS_GRADERS_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'GET_USERS_GRADERS_FAILURE':
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
