/**
 * Insert application wide common items here
 */

const inProduction = process.env.NODE_ENV === 'production'
const inDevelopment = process.env.NODE_ENV === 'development'

module.exports = {
  inProduction,
  inDevelopment
}
