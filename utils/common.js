/**
 * Insert application wide common items here
 */

const inProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging' // staging is production ¯\_(ツ)_/¯
const inDevelopment = process.env.NODE_ENV === 'development'
const inTest = process.env.NODE_ENV === 'test'

module.exports = {
  inProduction,
  inDevelopment,
  inTest
}
