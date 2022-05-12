import callBuilder from '../apiConnection'
/**
 * Actions and reducers are in the same file for readability
 */

export const getAllUsersAction = () => {
  const route = '/users'
  const prefix = 'GET_ALL_USERS'
  return callBuilder(route, prefix, 'get')
}

export const editUserAction = (user) => {
  const route = `/users/${user.id}`
  const prefix = 'EDIT_USER'
  return callBuilder(route, prefix, 'put', user)
}

export const fetchUser = (data) => {
  const route = `/users/fetch`
  const prefix = 'FETCH_USER'
  return callBuilder(route, prefix, 'post', data)
}

export const createUser = (data) => {
  const route = `/users`
  const prefix = 'ADD_USER'
  return callBuilder(route, prefix, 'post', data)
}

export const deleteUser = (id) => {
  const route = `/users/${id}`
  const prefix = 'DELETE_USER'
  return callBuilder(route, prefix, 'delete')
}

// Reducer
// You can include more app wide actions such as "selected: []" into the state
export default (state = { data: [], fetchedUser: {} }, action) => {
  switch (action.type) {
    case 'GET_ALL_USERS_SUCCESS':
      return {
        ...state,
        data: action.response,
        pending: false,
        error: false
      }
    case 'GET_ALL_USERS_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'GET_ALL_USERS_FAILURE':
      return {
        ...state,
        data: [],
        pending: false,
        error: true
      }
    case 'EDIT_USER_SUCCESS':
      return {
        ...state,
        data: state.data.filter((u) => u.id !== action.response.id).concat([action.response]),
        pending: false,
        error: false
      }
    case 'EDIT_USER_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'EDIT_USER_FAILURE':
      return {
        ...state,
        data: [],
        pending: false,
        error: true
      }
    case 'FETCH_USER_SUCCESS': {
      if (!action.response || !Object.keys(action.response).length)
        return {
          ...state,
          fetchedUser: { error: 'No user found!' },
          pending: false,
          error: true
        }
      return {
        ...state,
        fetchedUser: action.response,
        pending: false,
        error: false
      }
    }
    case 'FETCH_USER_ATTEMPT':
      return {
        ...state,
        fetchedUser: {},
        pending: true,
        error: false
      }
    case 'FETCH_USER_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
        fetchedUser: { error: action.response.message }
      }
    case 'ADD_USER_SUCCESS':
      return {
        data: state.data.concat(action.response),
        fetchedUser: {},
        pending: false,
        error: false
      }
    case 'ADD_USER_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'ADD_USER_FAILURE':
      return {
        ...state,
        pending: false,
        error: true,
        fetchedUser: { ...state.fetchedUser, error: action.response.message }
      }
    case 'DELETE_USER_SUCCESS':
      return {
        ...state,
        data: state.data.filter((u) => u.id !== action.response),
        pending: false,
        error: false
      }
    case 'DELETE_USER_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'DELETE_USER_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    default:
      return state
  }
}
