import callBuilder from '../apiConnection'
/**
 * Actions and reducers are in the same file for readability
 */

export const loginAction = () => {
  const route = '/login'
  const prefix = 'LOGIN'
  return callBuilder(route, prefix, 'post')
}

export const logoutAction = () => {
  const returnUrl = window.location.origin
  const route = '/logout'
  const prefix = 'LOGOUT'
  return callBuilder(route, prefix, 'post', { returnUrl: returnUrl })
}

// Reducer
// You can include more app wide actions such as "selected: []" into the state
export default (state = { data: null }, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        data: action.response,
        pending: false,
        error: false
      }
    case 'LOGOUT_SUCCESS':
      window.location = action.response.logoutUrl
      return {
        ...state,
        data: null,
        pending: false,
        error: false
      }
    default:
      return state
  }
}