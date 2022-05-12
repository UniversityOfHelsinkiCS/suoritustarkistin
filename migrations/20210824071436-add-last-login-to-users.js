'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return await queryInterface.addColumn('users', 'lastLogin', {
      type: Sequelize.DATE
    })
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.removeColumn('users', 'lastLogin')
  }
}
