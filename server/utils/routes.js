const Router = require('express')
const {
  getCourses,
  getUsersCourses,
  addCourse,
  editCourse,
  deleteAllCourses,
  deleteCourse
} = require('@controllers/courseController')
const {
  getUsers,
  getGraders,
  getUsersGraders,
  addUser,
  editUser,
  deleteAllUsers
} = require('@controllers/userController')
const {
  addReport,
  getReportList,
  getNewReportList,
  getReports,
  getUsersReports,
  getSingleReport,
  deleteAllReports
} = require('@controllers/reportController')
const {
  addRawEntries
} = require('@controllers/sisRawEntryController')
const {
  sisGetAllReports,
  sisGetUsersReports,
  sisDeleteSingleEntry,
  sendToSis
} = require('@controllers/sisReportController')
const {
  addJob,
  getJobs,
  editJob,
  runJob,
  deleteJob,
  deleteAllJobs
} = require('@controllers/jobsController')
const {
  getCourseRegistrations
} = require('@controllers/registrationController')
const { login, logout } = require('@controllers/loginController')
const {
  notInProduction,
  checkSuotarToken,
  checkAdmin,
  checkIdMatch
} = require('./middleware')

const router = Router()

// Routes for testing
router.delete('/courses', notInProduction, deleteAllCourses)
router.post('/users', notInProduction, addUser)
router.delete('/users', notInProduction, deleteAllUsers)
router.get('/reports/list', notInProduction, getReportList)
router.delete('/reports', notInProduction, deleteAllReports)
router.delete('/jobs', notInProduction, deleteAllJobs)

// Production routes
router.post('/login', login)
router.post('/logout', logout)

router.get('/courses', checkAdmin, getCourses)
router.post('/courses', addCourse)
router.get('/courses/:id/registrations', getCourseRegistrations)
router.put('/courses/:id', editCourse)
router.delete('/courses/:id', checkAdmin, deleteCourse)

router.get('/users', checkAdmin, getUsers)
router.get('/users/graders', checkAdmin, getGraders)
router.put('/users/:id', checkAdmin, editUser)
router.get('/users/:id/graders', checkIdMatch, getUsersGraders)
router.get('/users/:id/reports', checkIdMatch, getUsersReports)
router.get('/users/:id/sis_reports', checkIdMatch, sisGetUsersReports)
router.get('/users/:id/courses', checkIdMatch, getUsersCourses)

router.get('/reports/undownloaded', checkSuotarToken, getNewReportList)
router.get('/reports/:id', checkSuotarToken, getSingleReport)
router.post('/reports', addReport)
router.get('/reports', checkAdmin, getReports)

router.get('/sis_reports', checkAdmin, sisGetAllReports)
router.delete('/sis_reports/:id', checkAdmin, sisDeleteSingleEntry)

router.post('/sis_raw_entries', checkAdmin, addRawEntries)
router.post('/entries_to_sis', checkAdmin, sendToSis)

router.get('/jobs', checkAdmin, getJobs)
router.post('/jobs', checkAdmin, addJob)
router.put('/jobs/:id', checkAdmin, editJob)
router.post('/jobs/:id', checkAdmin, runJob)
router.delete('/jobs/:id', checkAdmin, deleteJob)

module.exports = router
