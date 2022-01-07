const Router = require('express')
const {
  checkEduweb,
  checkMooc
} = require('@controllers/apiCheckController')
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
const {
  getOodiReports,
  getUsersOodiReports
} = require('@controllers/oodiReportController')
const {
  addRawEntries
} = require('@controllers/rawEntryController')
const {
  getAllSisReports,
  getAllSisMoocReports,
  getAllEnrollmentLimboEntries,
  deleteSingleSisEntry,
  deleteSisBatch,
  sendToSis,
  refreshSisStatus,
  refreshEnrollments,
  getOffset
} = require('@controllers/reportController')
const {
  addJob,
  getJobs,
  editJob,
  runJob,
  deleteJob
} = require('@controllers/moocJobsController')
const {
  getKurkiCourses,
  addKurkiRawEntries
} = require('@controllers/kurkiController')
const { login, logout } = require('@controllers/loginController')

const {
  checkAdmin,
  checkIdMatch,
  notInProduction,
  deleteSingleEntry,
  checkGrader
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
router.delete('/sis_reports/:id', deleteSingleEntry, deleteSingleSisEntry)
router.delete('/sis_reports/batch/:batchId', checkAdmin, deleteSisBatch)
router.post('/sis_raw_entries', addRawEntries)
router.post('/entries_to_sis', checkAdmin, sendToSis)
router.post('/refresh_sis_status', checkAdmin, refreshSisStatus)
router.post('/refresh_sis_enrollments', checkAdmin, refreshEnrollments)
router.get('/sis_reports/offset/:batchId', checkGrader, getOffset)

router.get('/jobs', checkAdmin, getJobs)
router.post('/jobs', checkAdmin, addJob)
router.put('/jobs/:id', checkAdmin, editJob)
router.post('/jobs/:id', checkAdmin, runJob)
router.delete('/jobs/:id', checkAdmin, deleteJob)

router.get('/kurki/courses', checkAdmin, getKurkiCourses)
router.post('/kurki/raw_entries', checkAdmin, addKurkiRawEntries)

router.get('/apicheck/eduweb/:id', checkAdmin, checkEduweb)
router.get('/apicheck/mooc/:id', checkAdmin, checkMooc)

router.get('/status', (req, res) => res.send({ inMaintenance: !!process.env.IN_MAINTENANCE }))

module.exports = router
