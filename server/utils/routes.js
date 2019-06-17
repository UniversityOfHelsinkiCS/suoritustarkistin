const Router = require('express')
const { getCourses } = require('@controllers/courseController')
const { getGraders } = require('@controllers/graderController')

const router = Router()

router.get('/ping', (req, res) => res.send('pong'))

router.get('/courses', getCourses)
router.get('/graders', getGraders)

module.exports = router
