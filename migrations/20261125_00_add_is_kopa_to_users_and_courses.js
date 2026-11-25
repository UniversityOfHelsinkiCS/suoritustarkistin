'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'isKopa', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    })
    await queryInterface.addColumn('courses', 'isKopa', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    })
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'isKopa')
    await queryInterface.removeColumn('courses', 'isKopa')
  }
}
