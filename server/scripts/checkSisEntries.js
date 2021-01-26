const Sequelize = require('sequelize')
const db = require('../models/index')
const logger = require('@utils/logger')
const api = require('../config/importerApi')


const checkEntries = async (entries) => {
    const data = entries.map(({ personId, courseUnitRealisationId, assessmentItemId, gradeId, courseUnitId, id }) => ({
        id, personId, courseUnitRealisationId, assessmentItemId, gradeId, courseUnitId
    }))

    try {
        const resp = await api.post('/suotar/verify', data)
        const registeredEntries = resp.data.filter(({ registered }) => registered)
        const amountUpdated = await markAsRegistered(registeredEntries)
        logger.info({ message: `Checked total ${entries.length} entries, found ${amountUpdated} new registrations.`, sis: true, newRegistrations: registeredEntries.length, missingRegistrations: (entries.length - registeredEntries.length) })
        return true
    } catch (e) {
        logger.error({ message: 'Failed to check Sisu entries', error: e.toString(), sis: true })
    }
}

const markAsRegistered = async (entries) => {
    const ids = entries.map(({ id }) => id)
    return await db.entries.update({ registered: true }, { where: { id: { [Sequelize.Op.in]: ids } } })
}

const checkAllEntriesFromSisu = async () => {
    const entries = await db.entries.findAll({
        where: {
            registered: { [Sequelize.Op.eq]: null },
            sent: { [Sequelize.Op.not]: null }
        }
    })
    await checkEntries(entries)
}

module.exports = {
    checkAllEntriesFromSisu
}
