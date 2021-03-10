'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('raw_entries', 'courseId', {
      type: Sequelize.INTEGER,
      allowNull: true
    })
    await queryInterface.changeColumn('raw_entries', 'courseId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
          model: 'courses',
          key: 'id'
      }
    })
  },
  down: () => {}
};
