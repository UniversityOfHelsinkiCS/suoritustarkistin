'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkUpdate('credits', { reportId: 1 }, { reportId: null })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkUpdate('credits', { reportId: null }, { reportId: 1 })
  }
}
