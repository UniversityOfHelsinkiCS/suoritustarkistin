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

export const activateAdminModeAction = () => {
  return { type: 'ACTIVATE_ADMINMODE' }
}

export const disableAdminModeAction = () => {
  return { type: 'DISABLE_ADMINMODE' }
}

// Reducer
// You can include more app wide actions such as "selected: []" into the state
export default (state = { data: null }, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        data: { ...action.response, adminMode: false },
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
    case 'ACTIVATE_ADMINMODE':
      return {
        ...state,
        data: { ...state.data, adminMode: true }
      }
    case 'DISABLE_ADMINMODE':
      return {
        ...state,
        data: { ...state.data, adminMode: false }
      }
    default:
      return state
  }
}
