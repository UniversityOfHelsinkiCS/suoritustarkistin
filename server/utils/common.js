const common = require('@root/utils/common')

module.exports = {
  ...common,
  DB_URL: process.env.DB_URL,
  PORT: process.env.PORT || 8000
}
