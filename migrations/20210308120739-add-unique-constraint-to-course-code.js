'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addConstraint('courses', {
      fields: ['courseCode'],
      type: 'unique'

    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('courses', {
      fields: ['courseCode'],
      type: 'unique'
    })
  }
}
