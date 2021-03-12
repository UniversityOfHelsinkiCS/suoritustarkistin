import callBuilder from '../apiConnection'

export const getStatus = () => {
  const route = '/status'
  const prefix = 'SYSTEM_STATUS'
  return callBuilder(route, prefix, 'get')
}

export default (state = { inMaintenance: false }, action) => {
  switch (action.type) {
    case 'SYSTEM_STATUS_SUCCESS':
      return {
        ...state,
        inMaintenance: action.response.inMaintenance
      }
    default:
      return state
  }
}
