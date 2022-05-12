'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('raw_entries', 'reporterId', {
      type: Sequelize.INTEGER,
      allowNull: true
    })
    await queryInterface.changeColumn('raw_entries', 'reporterId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    })
  },
  down: () => {}
}
