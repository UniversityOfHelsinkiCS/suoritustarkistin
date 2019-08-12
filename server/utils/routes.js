const Router = require('express')
const {
  getCourses,
  addCourse,
  deleteAllCourses
} = require('@controllers/courseController')
const {
  getUsers,
  getGraders,
  getCurrentUser,
  addUser,
  deleteAllUsers
} = require('@controllers/userController')
const {
  addReport,
  getReportList,
  getNewReportList,
  getReports,
  getSingleReport,
  deleteAllReports
} = require('@controllers/reportController')
const {
  notInProduction,
  checkCSVToken,
  checkSuotarToken
} = require('./middleware')

const router = Router()

// Routes for testing
router.post('/courses', notInProduction, addCourse)
router.delete('/courses', notInProduction, deleteAllCourses)
router.post('/users', notInProduction, addUser)
router.delete('/users', notInProduction, deleteAllUsers)
router.get('/reports/list', notInProduction, getReportList)
router.delete('/reports', notInProduction, deleteAllReports)

// Production routes
router.get('/courses', getCourses)

router.get('/users', getUsers)
router.get('/users/graders', getGraders)
router.get('/users/current', getCurrentUser)

router.post('/reports', addReport)
router.get('/reports', checkSuotarToken, getReports)
router.get('/reports/undownloaded', checkSuotarToken, getNewReportList)
router.get('/reports/:id', checkSuotarToken, getSingleReport)

module.exports = router
