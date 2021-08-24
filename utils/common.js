/**
 * Insert application wide common items here
 */
const moment = require('moment')

const inProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging' // staging is production ¯\_(ツ)_/¯
const inDevelopment = process.env.NODE_ENV === 'development'
const inTest = process.env.NODE_ENV === 'test'

const gradeScales = [
  {
    key: "sis-0-5",
    value: "sis-0-5",
    text: "sis-0-5"
  },
  {
    key: "sis-hyl-hyv",
    value: "sis-hyl-hyv",
    text: "sis-hyl-hyv"
  }
]

const getBatchId = (courseCode) => `${courseCode}-${moment().tz("Europe/Helsinki").format(
  'DD.MM.YY-HHmmss'
)}` 

module.exports = {
  gradeScales,
  inProduction,
  inDevelopment,
  inTest,
  getBatchId
}
