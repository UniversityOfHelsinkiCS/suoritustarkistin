'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.removeConstraint('raw_entries', 'raw_entries_reporterId_fkey', { transaction })
      await queryInterface.changeColumn(
        'raw_entries',
        'reporterId',
        {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        { transaction }
      )
      await queryInterface.changeColumn(
        'raw_entries',
        'reporterId',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          onDelete: 'SET NULL',
          references: {
            model: 'users',
            key: 'id'
          }
        },
        { transaction }
      )
      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw new Error(error)
    }
  },
  down: () => {}
}
