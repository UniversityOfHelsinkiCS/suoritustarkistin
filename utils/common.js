/**
 * Insert application wide common items here
 */

const inProduction = process.env.NODE_ENV === 'production'
const inDevelopment = process.env.NODE_ENV === 'development'
const inTest = process.env.NODE_ENV === 'test'

module.exports = {
  inProduction,
  inDevelopment,
  inTest
}
