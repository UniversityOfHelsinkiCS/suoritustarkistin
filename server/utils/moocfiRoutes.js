/**
 * The courses.mooc.fi batch API, mounted ahead of graderOrAdminRouter because the spec's
 * paths are top level.
 */
const Router = require('express')

const { importAttainments } = require('@server/controllers/moocfi/importAttainments')
const { listByCourse } = require('@server/controllers/moocfi/listByCourse')
const { resolveEnrolments } = require('@server/controllers/moocfi/resolveEnrolments')
const { resolvePersons } = require('@server/controllers/moocfi/resolvePersons')
const { validateCourseCodes } = require('@server/controllers/moocfi/validateCourseCodes')
const { verifyAttainments } = require('@server/controllers/moocfi/verifyAttainments')

const { checkMoocfiToken } = require('./permissions')

const MOOCFI_PATHS = [
  '/persons',
  '/enrolments',
  '/attainments',
  '/open-university-product-access-tokens',
  '/course-codes'
]

const router = Router()

router.use(MOOCFI_PATHS, checkMoocfiToken)

router.post('/persons/resolve-by-student-numbers', resolvePersons)
router.post('/enrolments/resolve', resolveEnrolments)
router.post('/enrolments/list-by-course', listByCourse)
router.post('/attainments/import', importAttainments)
router.post('/attainments/verify', verifyAttainments)
router.post('/course-codes/validate', validateCourseCodes)

module.exports = { moocfiRouter: router, MOOCFI_PATHS }
