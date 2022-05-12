'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('entries', 'hasSent')
    await queryInterface.addColumn('entries', 'sent', {
      type: Sequelize.DATE,
      allowNull: true
    })
  },
  down: () => {}
}
