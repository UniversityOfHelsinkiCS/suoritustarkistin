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

// Production routes
router.post('/login', login)
router.post('/logout', logout)

router.get('/courses', checkAdmin, getCourses)
router.post('/courses', addCourse)
router.get('/courses/:id/registrations', getCourseRegistrations)
router.put('/courses/:id', editCourse)
router.delete('/courses/:id', checkAdmin, deleteCourse)

router.get('/users', getUsers)
router.get('/users/graders', checkAdmin, getGraders)
router.get('/users/:id/graders', checkIdMatch, getUsersGraders)
router.get('/users/:id/reports', checkIdMatch, getUsersReports)
router.get('/users/:id/courses', checkIdMatch, getUsersCourses)

router.get('/reports/undownloaded', checkSuotarToken, getNewReportList)
router.get('/reports/:id', checkSuotarToken, getSingleReport)
router.post('/reports', addReport)
router.get('/reports', checkAdmin, getReports)

module.exports = router
