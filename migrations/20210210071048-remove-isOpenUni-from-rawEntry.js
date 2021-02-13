'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('raw_entries', 'isOpenUni')
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('raw_entries', 'isOpenUni')
  }
}
