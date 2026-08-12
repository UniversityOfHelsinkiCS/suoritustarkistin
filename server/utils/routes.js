const Router = require('express')
const { checkEduweb, checkMooc, checkNewMooc, checkSisu } = require('@server/controllers/apiCheckController')
const { createEntries } = require('@server/controllers/apiController')
const {
  seedDatabaseForTests,
  seedTestCompletions,
  seedBachelorData,
  seedNoEntries,
  seedErilliskirjaus
} = require('@server/controllers/cypressController')
const {
  getCourses,
  getUsersCourses,
  addCourse,
  editCourse,
  confirmDeletion,
  deleteCourse,
  getCourseResponsibles
} = require('@server/controllers/courseController')
const {
  getUsers,
  getGraders,
  getUsersGraders,
  addUser,
  editUser,
  fetchUserDetails,
  deleteUser
} = require('@server/controllers/userController')
const { getOodiReports, getUsersOodiReports } = require('@server/controllers/oodiReportController')
const {
  addRawEntries,
  importStudents,
  notifyMissingEnrollment,
  importStudentsAttainments
} = require('@server/controllers/rawEntryController')
const {
  getAllSisReports,
  getAllSisMoocReports,
  getAllEnrollmentLimboEntries,
  getAllUnsentEntries,
  getUnsentBatchCount,
  deleteSingleSisEntry,
  deleteSisBatch,
  sendToSis,
  refreshSisStatus,
  refreshEnrollments,
  getOffset
} = require('@server/controllers/reportController')
const { addJob, getJobs, editJob, runJob, deleteJob } = require('@server/controllers/moocJobsController')
const { login, logout } = require('@server/controllers/loginController')

const { runJobs, dryRunJobs } = require('@server/controllers/cronController')

const {
  checkAdmin,
  checkIdMatch,
  notInProduction,
  deleteSingleEntry,
  checkGrader,
  checkToken,
  deleteBatch
} = require('./permissions')
const { paginateMiddleware, useFilters } = require('./middleware')
const { sendSentryError } = require('./sentry')

const router = Router()

// Sentry smoke tests, one per path an error can take to Sentry.
// Thrown in a route: caught by setupExpressErrorHandler.
router.get('/sandbox', checkAdmin, () => {
  throw new Error('Suotar exploded!')
})

// Rejected outside the request lifecycle: only reaches Sentry if init ran before
// the rest of the app loaded, so this is what proves the instrument.js hoist.
router.get('/sandbox/unhandled-rejection', checkAdmin, (req, res) => {
  setTimeout(() => Promise.reject(new Error('Suotar exploded asynchronously!')), 0)
  res.send('Unhandled rejection scheduled')
})

// Caught and reported by hand, the way the cron scripts and Sisu calls do it.
router.get('/sandbox/captured-error', checkAdmin, (req, res) => {
  try {
    throw new Error('Suotar exploded, but politely!')
  } catch (error) {
    sendSentryError('Sandbox captured error', error, { user: req.user, source: 'sandbox' })
  }
  res.send('Error captured and sent to Sentry')
})

// Routes for seeding the test database
router.get('/seed/all', notInProduction, seedDatabaseForTests)
router.get('/seed/no-entries', notInProduction, seedNoEntries)
router.get('/seed/bsc_thesis', notInProduction, seedBachelorData)
router.post('/seed/sis_completions', notInProduction, seedTestCompletions)
router.post('/seed/erilliskirjaus', notInProduction, seedErilliskirjaus)

// Production routes
router.post('/login', login)
router.post('/logout', logout)

router.get('/cron/dryrun', dryRunJobs)
router.get('/cron', runJobs)

router.get('/courses', checkAdmin, getCourses)
router.post('/courses', checkAdmin, addCourse)
router.put('/courses/:id', checkAdmin, editCourse)
router.get('/courses/:id/confirm_deletion', checkAdmin, confirmDeletion)
router.delete('/courses/:id/', checkAdmin, deleteCourse)
router.get('/courses/:courseCode/responsibles', checkAdmin, getCourseResponsibles)

router.get('/users', checkAdmin, getUsers)
router.get('/users/graders', checkAdmin, getGraders)
router.post('/users/fetch', checkAdmin, fetchUserDetails)
router.post('/users', checkAdmin, addUser)
router.put('/users/:id', checkAdmin, editUser)
router.delete('/users/:id', checkAdmin, deleteUser)
router.get('/users/:id/graders', checkIdMatch, getUsersGraders)
router.get('/users/:id/oodi_reports', checkIdMatch, getUsersOodiReports)
router.get('/users/:id/courses', checkIdMatch, getUsersCourses)

router.get('/oodi_reports', checkAdmin, getOodiReports)

router.use(['/sis_reports', '/sis_mooc_reports', '/enrollment_limbo', '/unsent_entries'], paginateMiddleware)
router.use(['/sis_reports', '/sis_mooc_reports'], useFilters)
router.get('/sis_reports', checkGrader, getAllSisReports)
router.get('/sis_mooc_reports', checkAdmin, getAllSisMoocReports)
router.get('/enrollment_limbo', checkAdmin, getAllEnrollmentLimboEntries)
router.get('/unsent_entries', checkAdmin, getAllUnsentEntries)
router.get('/unsent_batch_count', checkAdmin, getUnsentBatchCount)
router.delete('/sis_reports/:id', deleteSingleEntry, deleteSingleSisEntry)
router.delete('/sis_reports/batch/:batchId', deleteBatch, deleteSisBatch)
router.post('/sis_raw_entries', addRawEntries)
router.get('/import-students/:code', importStudents)
router.post('/import-students/attainments', importStudentsAttainments)
router.post('/entries_to_sis', sendToSis)
router.post('/refresh_sis_status', checkAdmin, refreshSisStatus)
router.post('/refresh_sis_enrollments', checkAdmin, refreshEnrollments)
router.get('/sis_reports/offset/:batchId', checkGrader, getOffset)
router.get('/sis_reports/missing_enrollment_email/:batchId', notifyMissingEnrollment)

router.get('/jobs', checkAdmin, getJobs)
router.post('/jobs', checkAdmin, addJob)
router.put('/jobs/:id', checkAdmin, editJob)
router.post('/jobs/:id', checkAdmin, runJob)
router.delete('/jobs/:id', checkAdmin, deleteJob)

router.get('/apicheck/eduweb/:id', checkAdmin, checkEduweb)
router.get('/apicheck/mooc/:id', checkAdmin, checkMooc)
router.get('/apicheck/newmooc/:id', checkAdmin, checkNewMooc)
router.get('/apicheck/sisu/:id', checkAdmin, checkSisu)

router.post('/create', checkToken, createEntries)

router.get('/status', (req, res) => res.send({ inMaintenance: !!process.env.IN_MAINTENANCE }))

module.exports = router
