'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return await queryInterface.addColumn('jobs', 'useManualCompletionDate', {
      type: Sequelize.BOOLEAN
    })
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.removeColumn('jobs', 'useManualCompletionDate')
  },
}