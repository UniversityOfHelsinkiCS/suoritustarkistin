/**
 * The courses.mooc.fi batch API, mounted ahead of graderOrAdminRouter because the spec's
 * paths are top level.
 */
const Router = require('express')

const { resolvePersons } = require('@server/controllers/moocfi/resolvePersons')

const { checkMoocfiToken } = require('./permissions')

// Scoped to prefixes, not the router: this router sees every request reaching the base
// router, so an unscoped `use` would 401 the whole API.
const MOOCFI_PATHS = ['/persons', '/enrolments', '/attainments', '/open-university-product-access-tokens']

const router = Router()

router.use(MOOCFI_PATHS, checkMoocfiToken)

router.post('/persons/resolve-by-student-numbers', resolvePersons)

module.exports = { moocfiRouter: router, MOOCFI_PATHS }
