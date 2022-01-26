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

const ALLOW_SEND_TO_SISU = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'
  ? true
  : process.env.SEND_TO_SISU || false

module.exports = {
  ...common,
  DB_URL: process.env.DB_URL,
  PORT: process.env.NODE_ENV === 'test' ? 8001 : process.env.PORT || 8000,
  ALLOW_SEND_TO_SISU,
  SHIBBOLETH_HEADERS,
  generateSisuId
}
