'use strict'
const axios = require('axios')

const api = axios.create({
  headers: {
    token: process.env.IMPORTER_DB_API_TOKEN || ''
  },
  baseURL: process.env.IMPORTER_DB_API_URL
})

const getUid = async ({ email, employeeId }) => {
  try {
    const userData = { email, employeeId }
    const { data } = await api.post('/suotar/resolve_user', userData)
    return data.eduPersonPrincipalName.split('@')[0]
  } catch (e) {
    return null
  }
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    //const users = await db.users.findAll({ where: { uid: null }, raw: true })
    const users = await queryInterface.sequelize.query('SELECT * FROM users WHERE uid IS NULL;')
    await Promise.all(
      users[0].map(async (u) => {
        const uid = await getUid(u)
        if (!uid) {
          console.log('NO UID FOUND FOR', u.email)
          return Promise.resolve()
        }
        try {
          await db.users.update({ uid }, { where: { id: u.id } })
        } catch (e) {}
        return Promise.resolve()
      })
    )
  },
  down: (queryInterface, Sequelize) => {}
}
