const Router = require('express')
const { checkEduweb, checkMooc, checkNewMooc, checkSisu } = require('@server/controllers/apiCheckController')
const { createEntries } = require('@server/controllers/apiController')
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

const { checkAdmin, checkIdMatch, deleteSingleEntry, checkGrader, checkToken, deleteBatch } = require('./permissions')
const { inProduction } = require('./common')
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

// Routes for seeding the test database. Registered only outside production so the
// test-only controller -- and the faker dependency it pulls in -- is never required
// there, which is what lets faker stay a devDependency and out of the production image.
if (!inProduction) {
  const {
    seedDatabaseForTests,
    seedTestCompletions,
    seedBachelorData,
    seedNoEntries,
    seedErilliskirjaus
  } = require('@server/controllers/cypressController')

  router.get('/seed/all', seedDatabaseForTests)
  router.get('/seed/no-entries', seedNoEntries)
  router.get('/seed/bsc_thesis', seedBachelorData)
  router.post('/seed/sis_completions', seedTestCompletions)
  router.post('/seed/erilliskirjaus', seedErilliskirjaus)
}

// Production routes
router.post('/login', login)
router.post('/logout', logout)

router.get('/cron/dryrun', dryRunJobs)
router.get('/cron', runJobs)

router.post('/create', checkToken, createEntries)

router.get('/status', (_req, res) => res.send({ inMaintenance: !!process.env.IN_MAINTENANCE }))

const graderOrAdminRouter = Router()
graderOrAdminRouter.use(checkGrader) // this allows both graders and admins to access paths in this route

graderOrAdminRouter.get('/courses', checkAdmin, getCourses)
graderOrAdminRouter.post('/courses', checkAdmin, addCourse)
graderOrAdminRouter.put('/courses/:id', checkAdmin, editCourse)
graderOrAdminRouter.get('/courses/:id/confirm_deletion', checkAdmin, confirmDeletion)
graderOrAdminRouter.delete('/courses/:id', checkAdmin, deleteCourse)
graderOrAdminRouter.get('/courses/:courseCode/responsibles', checkAdmin, getCourseResponsibles)

graderOrAdminRouter.get('/users', checkAdmin, getUsers)
graderOrAdminRouter.get('/users/graders', checkAdmin, getGraders)
graderOrAdminRouter.post('/users/fetch', checkAdmin, fetchUserDetails)
graderOrAdminRouter.post('/users', checkAdmin, addUser)
graderOrAdminRouter.put('/users/:id', checkAdmin, editUser)
graderOrAdminRouter.delete('/users/:id', checkAdmin, deleteUser)
graderOrAdminRouter.get('/users/:id/graders', checkIdMatch, getUsersGraders)
graderOrAdminRouter.get('/users/:id/oodi_reports', checkIdMatch, getUsersOodiReports)
graderOrAdminRouter.get('/users/:id/courses', checkIdMatch, getUsersCourses)

graderOrAdminRouter.get('/oodi_reports', checkAdmin, getOodiReports)

graderOrAdminRouter.use(
  ['/sis_reports', '/sis_mooc_reports', '/enrollment_limbo', '/unsent_entries'],
  paginateMiddleware
)
graderOrAdminRouter.use(['/sis_reports', '/sis_mooc_reports'], useFilters)
graderOrAdminRouter.get('/sis_reports', getAllSisReports)
graderOrAdminRouter.get('/sis_mooc_reports', checkAdmin, getAllSisMoocReports)
graderOrAdminRouter.get('/enrollment_limbo', checkAdmin, getAllEnrollmentLimboEntries)
graderOrAdminRouter.get('/unsent_entries', checkAdmin, getAllUnsentEntries)
graderOrAdminRouter.get('/unsent_batch_count', checkAdmin, getUnsentBatchCount)
graderOrAdminRouter.delete('/sis_reports/:id', deleteSingleEntry, deleteSingleSisEntry)
graderOrAdminRouter.delete('/sis_reports/batch/:batchId', deleteBatch, deleteSisBatch)
graderOrAdminRouter.post('/sis_raw_entries', addRawEntries)
graderOrAdminRouter.get('/import-students/:code', importStudents)
graderOrAdminRouter.post('/import-students/attainments', importStudentsAttainments)
graderOrAdminRouter.post('/entries_to_sis', sendToSis)
graderOrAdminRouter.post('/refresh_sis_status', checkAdmin, refreshSisStatus)
graderOrAdminRouter.post('/refresh_sis_enrollments', checkAdmin, refreshEnrollments)
graderOrAdminRouter.get('/sis_reports/offset/:batchId', getOffset)
graderOrAdminRouter.get('/sis_reports/missing_enrollment_email/:batchId', notifyMissingEnrollment)

graderOrAdminRouter.get('/jobs', checkAdmin, getJobs)
graderOrAdminRouter.post('/jobs', checkAdmin, addJob)
graderOrAdminRouter.put('/jobs/:id', checkAdmin, editJob)
graderOrAdminRouter.post('/jobs/:id', checkAdmin, runJob)
graderOrAdminRouter.delete('/jobs/:id', checkAdmin, deleteJob)

graderOrAdminRouter.get('/apicheck/eduweb/:id', checkAdmin, checkEduweb)
graderOrAdminRouter.get('/apicheck/mooc/:id', checkAdmin, checkMooc)
graderOrAdminRouter.get('/apicheck/newmooc/:id', checkAdmin, checkNewMooc)
graderOrAdminRouter.get('/apicheck/sisu/:id', checkAdmin, checkSisu)

router.use(graderOrAdminRouter)

module.exports = router
