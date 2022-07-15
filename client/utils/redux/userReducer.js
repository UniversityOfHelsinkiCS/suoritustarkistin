import callBuilder from '../apiConnection'
/**
 * Actions and reducers are in the same file for readability
 */

export const loginAction = () => {
  const route = '/login'
  const prefix = 'LOGIN'
  return callBuilder(route, prefix, 'post')
}

export const pingAction = () => {
  const route = '/login'
  const prefix = 'PING'
  return callBuilder(route, prefix, 'post')
}

export const logoutAction = () => {
  const returnUrl = window.location.origin
  const route = '/logout'
  const prefix = 'LOGOUT'
  return callBuilder(route, prefix, 'post', { returnUrl })
}

export const activateAdminModeAction = () => {
  window.localStorage.setItem('adminmode', 'true')
  return { type: 'ACTIVATE_ADMINMODE' }
}

export const disableAdminModeAction = () => {
  window.localStorage.setItem('adminmode', 'false')
  return { type: 'DISABLE_ADMINMODE' }
}

// Reducer
// You can include more app wide actions such as "selected: []" into the state
export default (state = { data: null }, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        data: {
          ...action.response,
          adminMode: action.response.isAdmin && window.localStorage.getItem('adminmode') === 'true'
        },
        pending: false,
        error: false
      }
    case 'LOGIN_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
        errorCode: action.errorCode
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
