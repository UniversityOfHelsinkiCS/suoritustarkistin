'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('entries', 'courseUnitId', {
      allowNull: false,
      type: Sequelize.STRING
    })
    await queryInterface.addColumn('entries', 'gradeScaleId', {
      allowNull: false,
      type: Sequelize.STRING
    })
    await queryInterface.addColumn('entries', 'gradeId', {
      allowNull: false,
      type: Sequelize.STRING
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('entries', 'courseUnitId')
    await queryInterface.removeColumn('entries', 'gradeScaleId')
    await queryInterface.removeColumn('entries', 'gradeId')
  }
}
