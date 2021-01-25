'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('entries', 'registered', {
      allowNull: true,
      type: Sequelize.BOOLEAN,
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('entries', 'registered')
  }
};
