'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.changeColumn('entries', 'courseUnitRealisationId', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
      })
      await queryInterface.changeColumn('entries', 'courseUnitRealisationName', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
      })
      await queryInterface.changeColumn('entries', 'assessmentItemId', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
      })
      await queryInterface.changeColumn('entries', 'courseUnitId', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
      })
      await queryInterface.changeColumn('entries', 'gradeScaleId', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
      })
      await queryInterface.changeColumn('entries', 'gradeId', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
      })
    } catch (e) {
      console.log(e)
      throw e
    }
  },
  down: (queryInterface, Sequelize) => {}
}
