'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.removeConstraint('entries', 'entries_senderId_fkey1', { transaction })
      await queryInterface.removeConstraint('raw_entries', 'raw_entries_reporterId_fkey1', { transaction })
      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw new Error(error)
    }
  },
  down: async () => {}
}
