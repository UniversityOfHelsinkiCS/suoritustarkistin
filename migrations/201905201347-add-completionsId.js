'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
      return queryInterface.addColumn(
        'credits',
        'completionsId',
        {
        type: Sequelize.STRING
        }
      )
    },
    down: (queryInterface, Sequelize) => {
      return queryInterface.removeColum(
        'credits',
        'completionsId'
      )
    }
}