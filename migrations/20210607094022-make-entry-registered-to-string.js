'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('entries', 'registered')
    await queryInterface.addColumn('entries', 'registered', {
      allowNull: false,
      type: Sequelize.STRING,
      defaultValue: 'NOT_REGISTERED'
    })
  },

  down: (queryInterface, Sequelize) => {}
}
