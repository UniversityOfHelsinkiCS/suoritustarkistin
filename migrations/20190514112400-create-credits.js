'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('credits', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      student_id: {
        allowNull: false,
        type: Sequelize.STRING
      },
      course_id: {
        allowNull: false,
        type: Sequelize.STRING
      },
      mooc_id: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      is_in_oodikone: {
        allowNull: false,
        type: Sequelize.BOOLEAN
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('credits');
  }
};