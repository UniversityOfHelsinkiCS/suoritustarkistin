const common = require('@root/utils/common')

const SHIBBOLETH_HEADERS = [
  'uid',
  'givenname', // First name
  'mail', // Email
  'schacpersonaluniquecode', // Contains student number
  'sn', // Last name
  'employeenumber'
]

module.exports = {
  ...common,
  DB_URL: process.env.DB_URL,
  PORT: process.env.PORT || 8000,
  SHIBBOLETH_HEADERS
}
