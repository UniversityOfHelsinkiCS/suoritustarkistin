if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

module.exports = {
  development: {
    database_url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false
  },
  test: {
    database_url: 'postgres://postgres:postgres@127.0.0.1:5432/circle_test',
    dialect: 'postgres'
  },
  production: {
    database_url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false
  }
}
