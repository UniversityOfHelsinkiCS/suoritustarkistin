'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('reports', [
      {
        id: 1,
        createdAt: Sequelize.fn('NOW'),
        updatedAt: Sequelize.fn('NOW'),
        data:
          'This is a placeholder report for the seed data that was reported before the implementation of this system.',
        fileName:
          'A placeholder for all the completions reported before implementation of this system and db.'
      }
    ])
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('reports', { id: 1 })
  }
}
