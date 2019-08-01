'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.renameTable('graders', 'users')
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.renameTable('users', 'graders')
  }
}
