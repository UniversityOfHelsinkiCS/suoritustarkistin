'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Sequelize creates extra foreign key constraints when changing the column with a foreign key reference.
    // Any earlier foreign key constraints needs to be remove before-hand.
    // And multiple queries within the same file need to have the same transaction in order to pass.

    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.removeConstraint('raw_entries', 'raw_entries_courseId_fkey', { transaction })
      await queryInterface.changeColumn(
        'raw_entries',
        'courseId',
        {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        { transaction }
      )
      await queryInterface.changeColumn(
        'raw_entries',
        'courseId',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          onDelete: 'SET NULL',
          references: {
            model: 'courses',
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
