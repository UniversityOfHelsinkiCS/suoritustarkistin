'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('courses', 'graderId')
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('courses', 'graderId')
  }
}
