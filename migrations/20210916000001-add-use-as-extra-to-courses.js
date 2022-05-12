'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return await queryInterface.addColumn('courses', 'useAsExtra', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    })
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.removeColumn('courses', 'useAsExtra')
  }
}
