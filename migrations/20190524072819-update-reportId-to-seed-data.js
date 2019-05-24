'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkUpdate('credits', { reportId: 1 }, { id: null })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkUpdate('credits', { reportId: null }, { id: 1 })
  }
}
