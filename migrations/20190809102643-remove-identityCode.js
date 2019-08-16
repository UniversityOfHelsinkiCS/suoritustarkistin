'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('users', 'identityCode')
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'identityCode')
  }
}
