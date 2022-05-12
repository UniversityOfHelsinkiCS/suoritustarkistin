'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('entries', 'senderId', {
      type: Sequelize.INTEGER,
      allowNull: true
    })
    await queryInterface.changeColumn('entries', 'senderId', {
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
