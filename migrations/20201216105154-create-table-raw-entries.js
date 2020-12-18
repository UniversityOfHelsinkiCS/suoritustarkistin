'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('raw_entries', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      studentNumber: {
        type: Sequelize.STRING,
        allowNull: false
      },
      batchId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      grade: {
        type: Sequelize.STRING,
        allowNull: false
      },
      credits: {
        type: Sequelize.STRING,
      },
      language: {
        type: Sequelize.STRING,
      },
      attainmentDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      graderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
      },
      reporterId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      courseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'courses',
          key: 'id'
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('raw_entries')
  },
};
