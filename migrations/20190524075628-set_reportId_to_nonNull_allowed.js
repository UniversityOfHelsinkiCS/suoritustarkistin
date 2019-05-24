'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('credits', 'reportId', {
      type: Sequelize.INTEGER,
      allowNull: false
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('credits', 'reportId', {
      type: Sequelize.INTEGER,
      allowNull: true
    })
  }
}
