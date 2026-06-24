const Router = require('express')
const { checkEduweb, checkMooc, checkNewMooc } = require('@controllers/apiCheckController')
const { createEntries } = require('@controllers/apiController')
const {
  seedDatabaseForTests,
  seedTestCompletions,
  seedBachelorData,
  seedNoEntries,
  seedErilliskirjaus
} = require('@controllers/cypressController')
const {
  getCourses,
  getUsersCourses,
  addCourse,
  editCourse,
  confirmDeletion,
  deleteCourse,
  getCourseResponsibles
} = require('@controllers/courseController')
const {
  getUsers,
  getGraders,
  getUsersGraders,
  addUser,
  editUser,
  fetchUserDetails,
  deleteUser
} = require('@controllers/userController')
const { getOodiReports, getUsersOodiReports } = require('@controllers/oodiReportController')
const {
  addRawEntries,
  importStudents,
  notifyMissingEnrollment,
  importStudentsAttainments
} = require('@controllers/rawEntryController')
const {
  getAllSisReports,
  getAllSisMoocReports,
  getAllEnrollmentLimboEntries,
  getUnsentBatchCount,
  deleteSingleSisEntry,
  deleteSisBatch,
  sendToSis,
  refreshSisStatus,
  refreshEnrollments,
  getOffset
} = require('@controllers/reportController')
const { addJob, getJobs, editJob, runJob, deleteJob } = require('@controllers/moocJobsController')
const { login, logout } = require('@controllers/loginController')

const { runJobs, dryRunJobs } = require('@controllers/cronController')

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

const router = Router()

router.get('/sandbox', () => {
  throw new Error('Suotar exploded!')
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

router.post('/create', checkToken, createEntries)

router.get('/status', (req, res) => res.send({ inMaintenance: !!process.env.IN_MAINTENANCE }))


const graderOrAdminRouter = Router()
graderOrAdminRouter.use(checkGrader) // this allows both graders and admins to access paths in this route

graderOrAdminRouter.get('/courses', checkAdmin, getCourses)
graderOrAdminRouter.post('/courses', checkAdmin, addCourse)
graderOrAdminRouter.put('/courses/:id', checkAdmin, editCourse)
graderOrAdminRouter.get('/courses/:id/confirm_deletion', checkAdmin, confirmDeletion)
graderOrAdminRouter.delete('/courses/:id/', checkAdmin, deleteCourse)
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

graderOrAdminRouter.use(['/sis_reports', '/sis_mooc_reports', '/enrollment_limbo'], paginateMiddleware)
graderOrAdminRouter.use(['/sis_reports', '/sis_mooc_reports'], useFilters)
graderOrAdminRouter.get('/sis_reports', checkGrader, getAllSisReports)
graderOrAdminRouter.get('/sis_mooc_reports', checkAdmin, getAllSisMoocReports)
graderOrAdminRouter.get('/enrollment_limbo', checkAdmin, getAllEnrollmentLimboEntries)
graderOrAdminRouter.get('/unsent_batch_count', checkAdmin, getUnsentBatchCount)
graderOrAdminRouter.delete('/sis_reports/:id', deleteSingleEntry, deleteSingleSisEntry)
graderOrAdminRouter.delete('/sis_reports/batch/:batchId', deleteBatch, deleteSisBatch)
graderOrAdminRouter.post('/sis_raw_entries', addRawEntries)
graderOrAdminRouter.get('/import-students/:code', importStudents)
graderOrAdminRouter.post('/import-students/attainments', importStudentsAttainments)
graderOrAdminRouter.post('/entries_to_sis', sendToSis)
graderOrAdminRouter.post('/refresh_sis_status', checkAdmin, refreshSisStatus)
graderOrAdminRouter.post('/refresh_sis_enrollments', checkAdmin, refreshEnrollments)
graderOrAdminRouter.get('/sis_reports/offset/:batchId', checkGrader, getOffset)
graderOrAdminRouter.get('/sis_reports/missing_enrollment_email/:batchId', notifyMissingEnrollment)

graderOrAdminRouter.get('/jobs', checkAdmin, getJobs)
graderOrAdminRouter.post('/jobs', checkAdmin, addJob)
graderOrAdminRouter.put('/jobs/:id', checkAdmin, editJob)
graderOrAdminRouter.post('/jobs/:id', checkAdmin, runJob)
graderOrAdminRouter.delete('/jobs/:id', checkAdmin, deleteJob)

graderOrAdminRouter.get('/apicheck/eduweb/:id', checkAdmin, checkEduweb)
graderOrAdminRouter.get('/apicheck/mooc/:id', checkAdmin, checkMooc)
graderOrAdminRouter.get('/apicheck/newmooc/:id', checkAdmin, checkNewMooc)

router.use(graderOrAdminRouter)


module.exports = router
