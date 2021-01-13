'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('entries', 'courseUnitRealisationName', {
      allowNull: false,
      type: Sequelize.JSONB,
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('entries', 'courseUnitRealisationName')
  }
};
