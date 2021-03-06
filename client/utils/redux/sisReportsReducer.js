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

export const sisHandleBatchDeletionAction = (batchId) => {
  const route = `/sis_reports/batch/${batchId}`
  const prefix = 'SIS_DELETE_BATCH'
  return callBuilder(route, prefix, 'delete')
}

export const sendEntriesToSisAction = (entryIds) => {
  const route = `/entries_to_sis`
  const prefix = 'SIS_POST_ENTRIES_TO_SIS'
  return callBuilder(route, prefix, 'post', entryIds)
}

export const refreshBatchStatus = (entryIds) => {
  const route = `/refresh_sis_status`
  const prefix = 'SIS_REFRESH_BATCH_STATUS'
  return callBuilder(route, prefix, 'post', entryIds)
}

export const refreshEnrollmentsAction = (rawEntryIds) => {
  const route = `/refresh_sis_enrollments`
  const prefix = 'SIS_REFRESH_ENROLLMENTS'
  return callBuilder(route, prefix, 'post', rawEntryIds)
}

export const openReport = (id) => ({
  type: 'OPEN_REPORT',
  id
})

const setOpenAccordions = (openAccordions, id) => {
  if (!openAccordions.includes(id)) {
    return [...openAccordions, id]
  }
  return openAccordions.filter((a) => a !== id)
}

// Reducer
// You can include more app wide actions such as "selected: []" into the state
export default (state = { data: [], openAccordions: [] }, action) => {
  switch (action.type) {
    case 'SIS_GET_ALL_REPORTS_SUCCESS':
      return {
        ...state,
        data: action.response,
        pending: false,
        error: false,
        reportsFetched: true
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
        error: false,
        reportsFetched: true
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
        singleBatchPending: false,
        error: false
      }
    case 'SIS_DELETE_SINGLE_ENTRY_ATTEMPT':
      return {
        ...state,
        pending: false,
        singleBatchPending: true,
        error: false
      }
    case 'SIS_DELETE_SINGLE_ENTRY_FAILURE':
      return {
        ...state,
        pending: false,
        singleBatchPending: false,
        error: true
      }
    case 'SIS_DELETE_BATCH_SUCCESS':
      return {
        ...state,
        openAccordions: [],
        data: state.data.filter((e) => e.batchId != action.response.batchId),
        pending: false,
        error: false
      }
    case 'SIS_DELETE_BATCH_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'SIS_DELETE_BATCH_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'SIS_POST_ENTRIES_TO_SIS_ATTEMPT':
      return {
        ...state,
        singleBatchPending: true,
        pending: false,
        error: false
      }
    case 'SIS_POST_ENTRIES_TO_SIS_FAILURE': {
      const { error } = action
      // When generic error occurs, no need to update entries in state
      if (error.genericError)
        return { ...state, pending: false, error: true }
      const updatedIds = error.map(({ id }) => id)
      const oldEntries = state.data.filter(({ id }) => !updatedIds.includes(id))
      const data = error.concat(oldEntries)
      return {
        ...state,
        data,
        pending: false,
        singleBatchPending: false,
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
        singleBatchPending: false,
        error: false
      }
    }
    case 'SIS_REFRESH_BATCH_STATUS_ATTEMPT':
      return {
        ...state,
        pending: false,
        singleBatchPending: true,
        error: false
      }
    case 'SIS_REFRESH_BATCH_STATUS_SUCCESS': {
      const updatedIds = action.response.map(({ id }) => id)
      const oldEntries = state.data.filter(({ id }) => !updatedIds.includes(id))
      const data = action.response.concat(oldEntries)
      return {
        ...state,
        data,
        pending: false,
        singleBatchPending: false,
        error: false
      }
    }
    case 'SIS_REFRESH_BATCH_STATUS_FAILURE':
      return {
        ...state,
        pending: false,
        singleBatchPending: false,
        error: true
      }
    case 'SIS_REFRESH_ENROLLMENTS_ATTEMPT':
      return {
        ...state,
        pending: true,
        refreshSuccess: false,
        error: false
      }
    case 'SIS_REFRESH_ENROLLMENTS_SUCCESS':
      return {
        ...state,
        pending: false,
        refreshSuccess: true,
        error: false
      }
    case 'SIS_REFRESH_ENROLLMENTS_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'OPEN_REPORT':
      return {
        ...state,
        openAccordions: setOpenAccordions(state.openAccordions, action.id)
      }
    case 'SIS_POST_RAW_ENTRIES_SUCCESS':
      return {
        ...state,
        reportsFetched: false
      }
    default:
      return state
  }
}
