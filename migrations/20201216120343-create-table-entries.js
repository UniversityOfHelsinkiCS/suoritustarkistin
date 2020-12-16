'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('entries', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      personId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      verifierPersonId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      courseUnitRealisationId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      assessmentItemId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      completionLanguage: {
        type: Sequelize.STRING,
      },
      completionDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      hasSent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      senderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
      },
    })
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('entries')
  },
};
