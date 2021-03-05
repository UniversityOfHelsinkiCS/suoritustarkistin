'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('courses', [
      {
        name: 'admin course',
        courseCode: 'AYTKT10000',
        createdAt: Sequelize.fn('NOW'),
        updatedAt: Sequelize.fn('NOW'),
        language: 'fi',
        credits: '5,0',
        graders: [1]
      },
      {
        name: 'grader course',
        courseCode: 'TKT20000',
        createdAt: Sequelize.fn('NOW'),
        updatedAt: Sequelize.fn('NOW'),
        language: 'en',
        credits: '10,0',
        graders: [2]
      }
    ])
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('courses', null)
  }
}
