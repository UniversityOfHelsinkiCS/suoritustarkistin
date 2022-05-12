'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('raw_entries', 'isOpenUni', {
      allowNull: false,
      defaultValue: false,
      type: Sequelize.BOOLEAN
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('raw_entries', 'isOpenUni')
  }
}
