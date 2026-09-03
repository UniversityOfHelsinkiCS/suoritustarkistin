/**
 * The courses.mooc.fi batch API, mounted ahead of graderOrAdminRouter because the spec's
 * paths are top level.
 */
const Router = require('express')

const { importAttainments } = require('@server/controllers/moocfi/importAttainments')
const { listByCourse } = require('@server/controllers/moocfi/listByCourse')
const { resolveEnrolments } = require('@server/controllers/moocfi/resolveEnrolments')
const { resolvePersons } = require('@server/controllers/moocfi/resolvePersons')

const { checkMoocfiToken } = require('./permissions')

// Scoped to prefixes, not the router: this router sees every request reaching the base
// router, so an unscoped `use` would 401 the whole API.
const MOOCFI_PATHS = ['/persons', '/enrolments', '/attainments', '/open-university-product-access-tokens']

const router = Router()

router.use(MOOCFI_PATHS, checkMoocfiToken)

router.post('/persons/resolve-by-student-numbers', resolvePersons)
router.post('/enrolments/resolve', resolveEnrolments)
router.post('/enrolments/list-by-course', listByCourse)
router.post('/attainments/import', importAttainments)

module.exports = { moocfiRouter: router, MOOCFI_PATHS }
