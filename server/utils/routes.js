const Router = require('express')
const {
  getCourses,
  addCourse,
  deleteAllCourses
} = require('@controllers/courseController')
const {
  getGraders,
  addGrader,
  deleteAllGraders
} = require('@controllers/graderController')
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
router.post('/graders', notInProduction, addGrader)
router.delete('/graders', notInProduction, deleteAllGraders)
router.get('/reports/list', notInProduction, getReportList)
router.delete('/reports', notInProduction, deleteAllReports)

// Production routes
router.get('/courses', getCourses)

router.get('/graders', getGraders)

router.post('/reports', checkCSVToken, addReport)
router.get('/reports', checkSuotarToken, getReports)
router.get('/reports/undownloaded', checkSuotarToken, getNewReportList)
router.get('/reports/:id', checkSuotarToken, getSingleReport)

module.exports = router
