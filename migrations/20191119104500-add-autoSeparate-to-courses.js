'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('courses', 'autoSeparate', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    })
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('courses', 'autoSeparate')
  }
}
