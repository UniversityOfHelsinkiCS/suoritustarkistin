'use strict'

// The credit range a KOPA course accepts, in the same "5,0" format as credits
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('courses', 'minCredits', { type: Sequelize.STRING, allowNull: true })
    await queryInterface.addColumn('courses', 'maxCredits', { type: Sequelize.STRING, allowNull: true })
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('courses', 'minCredits')
    await queryInterface.removeColumn('courses', 'maxCredits')
  }
}
