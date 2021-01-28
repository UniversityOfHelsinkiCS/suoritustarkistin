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
    database_url: 'postgres://postgres:postgres@localhost/circle_test',
    username: 'postgres',
    dialect: 'postgres'
  },
  production: {
    database_url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false
  },
  staging: {
    database_url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false
  }
}
