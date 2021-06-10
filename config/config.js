if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const OPTIONS = {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    statement_timeout: 10000,
    idle_in_transaction_session_timeout: 60 * 1000 * 5
  }
}

module.exports = {
  development: {
    database_url: process.env.DATABASE_URL,
    ...OPTIONS
  },
  test: {
    database_url: 'postgres://postgres:postgres@localhost/circle_test',
    username: 'postgres',
    ...OPTIONS
  },
  production: {
    database_url: process.env.DATABASE_URL,
    ...OPTIONS
  },
  staging: {
    database_url: process.env.DATABASE_URL,
    ...OPTIONS
  }
}
