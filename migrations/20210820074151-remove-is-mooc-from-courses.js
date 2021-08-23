'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('courses', 'isMooc')
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('courses', 'isMooc')
  }
}
