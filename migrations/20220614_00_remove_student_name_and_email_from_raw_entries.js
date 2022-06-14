'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('raw_entries', 'studentName')
    await queryInterface.removeColumn('raw_entries', 'email')
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('raw_entries', 'studentName', {
      type: Sequelize.STRING
    })
    await queryInterface.addColumn('raw_entries', 'email', {
      type: Sequelize.STRING
    })
  }
}
