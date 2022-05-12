'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('extra_entries', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING
      },
      personId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      verifierPersonId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      completionLanguage: {
        type: Sequelize.STRING,
        allowNull: false
      },
      gradeScaleId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      gradeId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      courseUnitId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      studyRightId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      completionDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      sent: {
        type: Sequelize.DATE,
        allowNull: true
      },
      senderId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      registered: {
        type: Sequelize.STRING,
        defaultValue: 'NOT_REGISTERED',
        allowNull: false
      },
      rawEntryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'raw_entries',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      errors: {
        type: Sequelize.JSONB,
        allowNull: true
      }
    })
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('extra_entries')
  }
}
