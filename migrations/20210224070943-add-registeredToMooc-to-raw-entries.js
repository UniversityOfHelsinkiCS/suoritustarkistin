'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('raw_entries', 'registeredToMooc', {
      allowNull: true,
      type: Sequelize.DATE,
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('raw_entries', 'registeredToMooc')
  }
}
