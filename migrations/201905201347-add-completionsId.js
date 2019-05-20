'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
      return queryInterface.addColumn(
        'credits',
        'completionId',
        {
        type: Sequelize.STRING
        }
      )
    },
    down: (queryInterface, Sequelize) => {
      return queryInterface.removeColumn(
        'credits',
        'completionId'
      )
    }
}