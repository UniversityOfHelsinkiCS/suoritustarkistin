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
    port: process.env.PGPORT
  },
  test: {
    username: process.env.PGUSERNAME,
    password: process.env.PGPASSWORD,
    database: 'suoritustarkistin_test',
    host: process.env.PGHOST,
    dialect: 'postgres',
    port: process.env.PGPORT
  },
  production: {
    username: process.env.PGUSERNAME,
    password: process.env.PGPASSWORD,
    database: 'suoritustarkistin_production',
    host: process.env.PGHOST,
    dialect: 'postgres',
    port: process.env.PGPORT
  }
}
