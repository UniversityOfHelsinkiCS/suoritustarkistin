'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('reports', [
      {
        createdAt: Sequelize.fn('NOW'),
        updatedAt: Sequelize.fn('NOW'),
        data: '000000000##6#TKT00000#The Art of Mocking#16.5.2019#0#Hyv.#106##000000-0000#1#H930#11#93013#3##0,0',
        fileName: 'MOCKDATA.dat'
      }
    ])
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('reports', { id: 1 })
  }
}
