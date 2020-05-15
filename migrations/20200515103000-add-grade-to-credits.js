'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('credits', 'grade', {
      allowNull: false,
      defaultValue: 'Hyv.',
      type: Sequelize.STRING,
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('credits', 'grade')
  },
}
