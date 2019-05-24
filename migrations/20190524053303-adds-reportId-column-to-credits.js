'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('credits', 'reportId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'reports',
        key: 'id'
      },
      onDelete: 'SET NULL'
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('credits', 'reportId')
  }
}
