'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('raw_entries', 'moocCompletionId', {
      allowNull: true,
      type: Sequelize.STRING
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('raw_entries', 'moocCompletionId')
  }
}
