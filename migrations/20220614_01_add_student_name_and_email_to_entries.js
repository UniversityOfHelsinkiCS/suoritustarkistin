'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('entries', 'studentName', {
      type: Sequelize.STRING
    })
    await queryInterface.addColumn('entries', 'email', {
      type: Sequelize.STRING
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('entries', 'studentName')
    await queryInterface.removeColumn('entries', 'email')
  }
}
