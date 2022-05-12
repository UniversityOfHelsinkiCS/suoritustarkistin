'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.removeConstraint('entries', 'entries_senderId_fkey', { transaction })
      await queryInterface.changeColumn(
        'entries',
        'senderId',
        {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        { transaction }
      )
      await queryInterface.changeColumn(
        'entries',
        'senderId',
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
