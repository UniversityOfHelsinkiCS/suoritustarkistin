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


export const sisHandleEntryDeletionAction = (id) => {
  const route = `/sis_reports/${id}`
  const prefix = 'SIS_DELETE_SINGLE_ENTRY'
  return callBuilder(route, prefix, 'delete')
}

export const sendEntriesToSisAction = (entryIds) => {
  const route = `/entries_to_sis`
  const prefix = 'SIS_POST_ENTRIES_TO_SIS'
  return callBuilder(route, prefix, 'post', entryIds)
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
    case 'SIS_DELETE_SINGLE_ENTRY_SUCCESS':
      return {
        ...state,
        data: state.data.filter((e) => e.id != action.response.id),
        pending: false,
        error: false
      }
    case 'SIS_DELETE_SINGLE_ENTRY_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'SIS_DELETE_SINGLE_ENTRY_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'SIS_POST_ENTRIES_TO_SIS_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'SIS_POST_ENTRIES_TO_SIS_FAILURE': {
      const { error } = action
      // When generic error occurs, no need to update entries in state
      if (error.genericError)
        return { ...state, pending: false, error: true}
      const updatedIds = error.map(({ id }) => id)
      const oldEntries = state.data.filter(({ id }) => !updatedIds.includes(id))
      const data = error.concat(oldEntries)
      return {
        ...state,
        data,
        pending: false,
        error: true
      }
    }
    case 'SIS_POST_ENTRIES_TO_SIS_SUCCESS': {
      const updatedIds = action.response.map(({ id }) => id)
      const oldEntries = state.data.filter(({ id }) => !updatedIds.includes(id))
      const data = action.response.concat(oldEntries)
      return {
        ...state,
        data,
        pending: false,
        error: false
      }
    }
    default:
      return state
  }
}
