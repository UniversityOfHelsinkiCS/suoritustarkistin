'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn(
          'reports',
          'graderId',
          {
            type: Sequelize.INTEGER,
            references: {
              model: 'users',
              key: 'id'
            },
            onDelete: 'SET NULL'
          },
          { transaction: t }
        ),
        queryInterface.addColumn(
          'reports',
          'reporterId',
          {
            type: Sequelize.INTEGER,
            references: {
              model: 'users',
              key: 'id'
            },
            onDelete: 'SET NULL'
          },
          { transaction: t }
        )
      ])
    })
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('reports', 'graderId', { transaction: t }),
        queryInterface.removeColumn('reports', 'graderId', { transaction: t })
      ])
    })
  }
}
