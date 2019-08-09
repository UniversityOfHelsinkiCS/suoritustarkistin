'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('users', [
      {
        name: 'adminope',
        employeeId: '9876543',
        createdAt: Sequelize.fn('NOW'),
        updatedAt: Sequelize.fn('NOW'),
        isGrader: true,
        isAdmin: true
      },
      {
        name: 'graderope',
        employeeId: '0000001',
        createdAt: Sequelize.fn('NOW'),
        updatedAt: Sequelize.fn('NOW'),
        isGrader: true,
        isAdmin: false
      },
      {
        name: 'ope',
        employeeId: '0000000',
        createdAt: Sequelize.fn('NOW'),
        updatedAt: Sequelize.fn('NOW'),
        isGrader: false,
        isAdmin: false
      },
      {
        name: 'oppilas',
        employeeId: '',
        createdAt: Sequelize.fn('NOW'),
        updatedAt: Sequelize.fn('NOW'),
        isGrader: false,
        isAdmin: false
      }
    ])
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('users', null)
  }
}
