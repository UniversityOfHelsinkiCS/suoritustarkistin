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

const { runJobs } = require('@controllers/cronController')

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

router.get('/cron', runJobs)

router.get('/courses', checkAdmin, getCourses)
router.post('/courses', addCourse)
router.put('/courses/:id', editCourse)
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

router.use(['/sis_reports', '/sis_mooc_reports', '/enrollment_limbo'], paginateMiddleware)
router.use(['/sis_reports', '/sis_mooc_reports'], useFilters)
router.get('/sis_reports', checkGrader, getAllSisReports)
router.get('/sis_mooc_reports', checkAdmin, getAllSisMoocReports)
router.get('/enrollment_limbo', checkAdmin, getAllEnrollmentLimboEntries)
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

router.post('/create', checkToken, createEntries)

router.get('/status', (req, res) => res.send({ inMaintenance: !!process.env.IN_MAINTENANCE }))

module.exports = router
