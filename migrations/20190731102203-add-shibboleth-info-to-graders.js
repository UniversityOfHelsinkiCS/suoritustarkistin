'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn(
          'graders',
          'employeeId',
          {
            type: Sequelize.STRING
          },
          { transaction: t }
        ),
        queryInterface.addColumn(
          'graders',
          'email',
          {
            type: Sequelize.STRING
          },
          { transaction: t }
        ),
        queryInterface.addColumn(
          'graders',
          'isGrader',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
          },
          { transaction: t }
        ),
        queryInterface.addColumn(
          'graders',
          'isAdmin',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
          },
          { transaction: t }
        )
      ])
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('graders', 'employeeId', {
          transaction: t
        }),
        queryInterface.removeColumn('graders', 'email', { transaction: t }),
        queryInterface.removeColumn('graders', 'isGrader', { transaction: t }),
        queryInterface.removeColumn('graders', 'isAdmin', { transaction: t })
      ])
    })
  }
}
