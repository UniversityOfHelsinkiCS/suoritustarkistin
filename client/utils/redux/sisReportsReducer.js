const _ = require('lodash')
import callBuilder from '../apiConnection'
/**
 * Actions and reducers are in the same file for readability
 */

export const getAllSisReportsAction = (offset = 0, limit) => {
  const route = `/sis_reports?offset=${offset}${limit ? `&limit=${limit}` : ''}`
  const prefix = 'GET_ALL_SIS_REPORTS'
  return callBuilder(route, prefix, 'get', { params: { offset, limit } })
}

export const getAllMoocSisReportsAction = (offset = 0, limit) => {
  const route = `/sis_mooc_reports?offset=${offset}${limit ? `&limit=${limit}` : ''}`
  const prefix = 'GET_ALL_MOOC_SIS_REPORTS'
  return callBuilder(route, prefix, 'get', { params: { offset, limit } })
}

export const getAllEnrollmentLimboEntriesAction = (offset = 0, limit) => {
  const route = `/enrollment_limbo?offset=${offset}${limit ? `&limit=${limit}` : ''}`
  const prefix = 'GET_ALL_ENROLLMENT_LIMBO'
  return callBuilder(route, prefix, 'get', { params: { offset, limit } })
}

export const getOffsetForBatchAction = (batchId) => {
  const route = `/sis_reports/offset/${batchId}`
  const prefix = 'GET_OFFSET'
  return callBuilder(route, prefix, 'get')
}

export const getUsersSisReportsAction = (id) => {
  const route = `/users/${id}/sis_reports`
  const prefix = 'GET_USERS_SIS_REPORTS'
  return callBuilder(route, prefix, 'get')
}

export const handleEntryDeletionAction = (id) => {
  const route = `/sis_reports/${id}`
  const prefix = 'DELETE_SINGLE_ENTRY'
  return callBuilder(route, prefix, 'delete')
}

export const handleBatchDeletionAction = (batchId) => {
  const route = `/sis_reports/batch/${batchId}`
  const prefix = 'DELETE_BATCH'
  return callBuilder(route, prefix, 'delete')
}

export const sendEntriesToSisAction = (entryIds) => {
  const route = `/entries_to_sis`
  const prefix = 'POST_ENTRIES_TO_SIS'
  return callBuilder(route, prefix, 'post', entryIds)
}

export const refreshBatchStatus = (entryIds) => {
  const route = `/refresh_sis_status`
  const prefix = 'REFRESH_BATCH_STATUS'
  return callBuilder(route, prefix, 'post', entryIds)
}

export const refreshEnrollmentsAction = (rawEntryIds) => {
  const route = `/refresh_sis_enrollments`
  const prefix = 'REFRESH_ENROLLMENTS'
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

const INITIAL_DATA = {
  rows: [],
  offset: 0,
  reportsFetched: false // HACK
}

const INITIAL_STATE = {
  reports: INITIAL_DATA,
  moocReports: INITIAL_DATA,
  enrolmentLimbo: INITIAL_DATA,
  openAccordions: [],
  pending: false,
  error: false
}

// Reducer
// You can include more app wide actions such as "selected: []" into the state
export default (state = _.cloneDeep(INITIAL_STATE), action) => {
  switch (action.type) {
    case 'GET_ALL_SIS_REPORTS_SUCCESS':
      return {
        ...state,
        reports: { ...action.response, reportsFetched: true },
        pending: false,
        error: false
      }
    case 'GET_ALL_MOOC_SIS_REPORTS_SUCCESS':
      return {
        ...state,
        moocReports: { ...action.response, reportsFetched: true },
        pending: false,
        error: false
      }
    case 'GET_ALL_ENROLLMENT_LIMBO_SUCCESS':
      return {
        ...state,
        enrolmentLimbo: { ...action.response, reportsFetched: true },
        pending: false,
        error: false
      }
    case 'GET_ALL_SIS_REPORTS_ATTEMPT' || 'GET_ALL_MOOC_SIS_REPORTS_ATTEMPT' || 'GET_ALL_ENROLLMENT_LIMBO_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'GET_ALL_SIS_REPORTS_FAILURE' || 'GET_ALL_MOOC_SIS_REPORTS_ATTEMPT' || 'GET_ALL_ENROLLMENT_LIMBO_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'DELETE_SINGLE_ENTRY_SUCCESS': {
      const { openAccordions } = state
      return {
        ...state,
        ..._.cloneDeep(INITIAL_STATE),
        openAccordions,
        pending: false,
        singleBatchPending: false,
        error: false
      }
    }
    case 'DELETE_SINGLE_ENTRY_ATTEMPT':
      return {
        ...state,
        pending: false,
        singleBatchPending: true,
        error: false
      }
    case 'DELETE_SINGLE_ENTRY_FAILURE':
      return {
        ...state,
        pending: false,
        singleBatchPending: false,
        error: true
      }
    case 'DELETE_BATCH_SUCCESS':
      return {
        ...state,
        ..._.cloneDeep(INITIAL_STATE),
        reportsFetched: false,
        openAccordions: [],
        pending: false,
        error: false
      }
    case 'DELETE_BATCH_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'DELETE_BATCH_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'POST_ENTRIES_TO_SIS_ATTEMPT':
      return {
        ...state,
        singleBatchPending: true,
        pending: false,
        error: false
      }
    case 'POST_ENTRIES_TO_SIS_FAILURE': {
      return {
        ...state,
        ..._.cloneDeep(INITIAL_STATE),
        reportsFetched: false,
        pending: false,
        singleBatchPending: false,
        error: true
      }
    }
    case 'POST_ENTRIES_TO_SIS_SUCCESS': {
      return {
        ...state,
        ..._.cloneDeep(INITIAL_STATE),
        reportsFetched: false,
        pending: false,
        singleBatchPending: false,
        error: false
      }
    }
    case 'REFRESH_BATCH_STATUS_ATTEMPT':
      return {
        ...state,
        pending: false,
        singleBatchPending: true,
        error: false
      }
    case 'REFRESH_BATCH_STATUS_SUCCESS': {
      return {
        ...state,
        pending: false,
        singleBatchPending: false,
        error: false
      }
    }
    case 'REFRESH_BATCH_STATUS_FAILURE':
      return {
        ...state,
        pending: false,
        singleBatchPending: false,
        error: true
      }
    case 'REFRESH_ENROLLMENTS_ATTEMPT':
      return {
        ...state,
        pending: true,
        refreshSuccess: false,
        error: false
      }
    case 'REFRESH_ENROLLMENTS_SUCCESS':
      return {
        ...state,
        enrolmentLimbo: { ...INITIAL_DATA },
        pending: false,
        error: false
      }
    case 'REFRESH_ENROLLMENTS_FAILURE':
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
    case 'POST_RAW_ENTRIES_SUCCESS':
      return {
        ...state,
        reportsFetched: false
      }
    case 'GET_OFFSET_SUCCESS': {
      const key = action.response.mooc ? 'moocReports' : 'reports'
      const { offset, mooc } = action.response
      return {
        ...state,
        [key]: { ...state[key], offset },
        allowFetch: true,
        mooc
      }
    }
    default:
      return state
  }
}
