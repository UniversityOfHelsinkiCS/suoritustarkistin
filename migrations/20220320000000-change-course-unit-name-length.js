'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return await queryInterface.changeColumn('entries', 'courseUnitRealisationName', {
      type: Sequelize.STRING(2024)
    })
  },
  down: () => {},
}