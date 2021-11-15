const common = require('@root/utils/common')
const { v4: uuidv4 } = require('uuid')

const SHIBBOLETH_HEADERS = [
  'uid',
  'givenname', // First name
  'mail', // Email
  'schacpersonaluniquecode', // Contains student number
  'sn', // Last name
  'employeenumber'
]

const generateSisuId = () => `hy-kur-${uuidv4()}`

module.exports = {
  ...common,
  DB_URL: process.env.DB_URL,
  PORT: process.env.NODE_ENV === 'test' ? 8001 : process.env.PORT || 8000,
  SHIBBOLETH_HEADERS,
  generateSisuId
}
