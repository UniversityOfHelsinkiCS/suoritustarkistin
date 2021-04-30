const api = require('../config/importerApi')
const db = require('../models/index')
const logger = require('./logger')
const { Op } = require("sequelize")

const getUid = async ({ email, employeeId }) => {
  try {
    const userData = { email, employeeId }
    const { data } = await api.post('/suotar/resolve_user', userData)
    return data.eduPersonPrincipalName.split('@')[0]
  } catch (e) {
    return null
  }
}

/*
 Simple script to populate uid for users missing it.
 Usage: npm run populate:uid
 Note, run the command inside the container where you want to populate!
*/

const run = async () => {
  logger.info("Populating uids")
  const users = await db.users.findAll({ where: { uid: { [Op.or]: [null, ""] } }, raw: true })
  let count = 0
  await Promise.all(users.map(async (u) => {
    const uid = await getUid(u)
    if (!uid) {
      logger.error(`No uid found for user ${u.email}`)
      return Promise.resolve()
    }
    await db.users.update({ uid }, { where: { id: u.id } })
    count += 1
    return Promise.resolve()
  }))
  logger.info(`Successfully updated UID for ${count} user(s)`)
  process.exit()
}

run()
