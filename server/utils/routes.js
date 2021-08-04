const Router = require('express')
const {
  getCourses,
  getUsersCourses,
  addCourse,
  editCourse,
  deleteAllCourses,
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
  deleteAllUsers,
  fetchUserDetails,
  deleteUser
} = require('@controllers/userController')
const {
  getReportList,
  getReports,
  getUsersReports,
  deleteAllReports
} = require('@controllers/reportController')
const {
  addRawEntries
} = require('@controllers/sisRawEntryController')
const {
  sisGetAllReports,
  sisGetUsersReports,
  sisDeleteSingleEntry,
  sisDeleteBatch,
  sendToSis,
  refreshSisStatus,
  refreshEnrollments
} = require('@controllers/sisReportController')
const {
  addJob,
  getJobs,
  editJob,
  sisRunJob,
  deleteJob,
  deleteAllJobs
} = require('@controllers/moocJobsController')
const {
  getKurkiCourses,
  addKurkiRawEntries
} = require('@controllers/kurkiController')
const {
  getCourseRegistrations
} = require('@controllers/registrationController')
const { login, logout } = require('@controllers/loginController')

const {
  checkAdmin,
  checkIdMatch,
  notInProduction,
  deleteSingleEntry
} = require('./permissions')

const router = Router()

router.get('/sandbox', () => {
  throw new Error('Suotar exploded!')
})

// Routes for seeding the test database
router.delete('/seed/courses', notInProduction, deleteAllCourses)
router.delete('/seed/users', notInProduction, deleteAllUsers)
router.get('/seed/reports/list', notInProduction, getReportList)
router.delete('/seed/reports', notInProduction, deleteAllReports)
router.delete('/seed/jobs', notInProduction, deleteAllJobs)
router.post('/seed/users', notInProduction, addUser)

// Production routes
router.post('/login', login)
router.post('/logout', logout)

router.get('/courses', checkAdmin, getCourses)
router.post('/courses', addCourse)
router.get('/courses/:id/registrations', getCourseRegistrations)
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
router.get('/users/:id/oodi_reports', checkIdMatch, getUsersReports)
router.get('/users/:id/sis_reports', checkIdMatch, sisGetUsersReports)
router.get('/users/:id/courses', checkIdMatch, getUsersCourses)

router.get('/oodi_reports', checkAdmin, getReports)

router.get('/sis_reports', checkAdmin, sisGetAllReports)
router.delete('/sis_reports/:id', deleteSingleEntry, sisDeleteSingleEntry)
router.delete('/sis_reports/batch/:batchId', checkAdmin, sisDeleteBatch)
router.post('/sis_raw_entries', addRawEntries)
router.post('/entries_to_sis', checkAdmin, sendToSis)
router.post('/refresh_sis_status', checkAdmin, refreshSisStatus)
router.post('/refresh_sis_enrollments', checkAdmin, refreshEnrollments)

router.get('/jobs', checkAdmin, getJobs)
router.post('/jobs', checkAdmin, addJob)
router.put('/jobs/:id', checkAdmin, editJob)
router.post('/jobs/:id', checkAdmin, sisRunJob)
router.delete('/jobs/:id', checkAdmin, deleteJob)

router.get('/kurki/courses', checkAdmin, getKurkiCourses)
router.post('/kurki/raw_entries', checkAdmin, addKurkiRawEntries)

router.get('/status', (req, res) => res.send({ inMaintenance: !!process.env.IN_MAINTENANCE }))

module.exports = router
