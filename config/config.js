if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

module.exports = {
  development: {
    username: process.env.PGUSERNAME,
    password: process.env.PGPASSWORD,
    database: 'suoritustarkistin_dev',
    host: process.env.PGHOST,
    dialect: 'postgres',
    port: process.env.PGPORT,
    logging: false
  },
  test: {
    username: 'postgres',
    password: '',
    database: 'circle_test',
    host: '127.0.0.1',
    dialect: 'postgres'
  },
  production: {
    username: process.env.PGUSERNAME,
    password: process.env.PGPASSWORD,
    database: 'suoritustarkistin_production',
    host: process.env.PGHOST,
    dialect: 'postgres',
    port: process.env.PGPORT,
    logging: false
  }
}
