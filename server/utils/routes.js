const Router = require('express')
const { getCourses, addCourse } = require('@controllers/courseController')
const { getGraders, addGrader } = require('@controllers/graderController')
const { notInProduction } = require('./middleware')

const router = Router()

router.get('/ping', (req, res) => res.send('pong'))

router.get('/courses', getCourses)
router.post('/courses', notInProduction, addCourse)

router.get('/graders', getGraders)
router.post('/graders', notInProduction, addGrader)

module.exports = router
