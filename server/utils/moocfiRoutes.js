/**
 * The courses.mooc.fi batch API. Everything it serves lives under one prefix of its own, so
 * the guard sits at the router root and no internal /api route can collide with it.
 */
const Router = require('express')

const { importAttainments } = require('@server/controllers/moocfi/importAttainments')
const { listByCourse } = require('@server/controllers/moocfi/listByCourse')
const { resolveEnrolments } = require('@server/controllers/moocfi/resolveEnrolments')
const { resolvePersons } = require('@server/controllers/moocfi/resolvePersons')
const { validateCourseCodes } = require('@server/controllers/moocfi/validateCourseCodes')
const { verifyAttainments } = require('@server/controllers/moocfi/verifyAttainments')

const { checkMoocfiToken } = require('./permissions')

const MOOCFI_PREFIX = '/moocfi'

const router = Router()

router.use(checkMoocfiToken)

router.post('/persons/resolve-by-student-numbers', resolvePersons)
router.post('/enrolments/resolve', resolveEnrolments)
router.post('/enrolments/list-by-course', listByCourse)
router.post('/attainments/import', importAttainments)
router.post('/attainments/verify', verifyAttainments)
router.post('/course-codes/validate', validateCourseCodes)

module.exports = { moocfiRouter: router, MOOCFI_PREFIX }
