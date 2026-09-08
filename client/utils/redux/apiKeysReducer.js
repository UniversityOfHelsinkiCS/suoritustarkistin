import callBuilder from '../apiConnection'

export const getApiKeysAction = () => {
  const route = '/api_keys'
  const prefix = 'GET_API_KEYS'
  return callBuilder(route, prefix, 'get')
}

export const addApiKeyAction = (data) => {
  const route = '/api_keys'
  const prefix = 'ADD_API_KEY'
  return callBuilder(route, prefix, 'post', data)
}

export const revokeApiKeyAction = (id) => {
  const route = `/api_keys/${id}`
  const prefix = 'REVOKE_API_KEY'
  return callBuilder(route, prefix, 'delete')
}

export const dismissCreatedTokenAction = () => ({ type: 'DISMISS_CREATED_TOKEN' })

export default (state = { data: [], createdToken: null }, action) => {
  switch (action.type) {
    case 'GET_API_KEYS_SUCCESS':
      return { ...state, data: action.response, error: false }
    case 'ADD_API_KEY_SUCCESS':
      return {
        ...state,
        data: [action.response.apiKey, ...state.data],
        createdToken: action.response.token,
        error: false
      }
    case 'REVOKE_API_KEY_SUCCESS':
      return {
        ...state,
        data: state.data.map((key) => (key.id === action.response.id ? action.response : key)),
        error: false
      }
    case 'DISMISS_CREATED_TOKEN':
      return { ...state, createdToken: null }
    case 'GET_API_KEYS_FAILURE':
    case 'ADD_API_KEY_FAILURE':
    case 'REVOKE_API_KEY_FAILURE':
      return { ...state, error: true }
    default:
      return state
  }
}
