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
    database_url: 'postgres://postgres:postgres@e2e-db:5432/postgres',
    username: 'postgres',
    dialect: 'postgres',
    database: 'postgres',
    logging: false
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
