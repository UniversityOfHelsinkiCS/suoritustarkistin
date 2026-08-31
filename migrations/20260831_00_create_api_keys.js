'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('api_keys', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      client: {
        type: Sequelize.STRING,
        allowNull: false
      },
      // SHA-256 of the token
      tokenHash: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      // The leading, non-secret part of the token, so an admin can tell two keys apart in
      // the UI without anything sensitive being stored.
      prefix: {
        type: Sequelize.STRING,
        allowNull: false
      },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL'
      },
      revokedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL'
      },
      revokedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lastUsedAt: {
        type: Sequelize.DATE,
        allowNull: true
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

  down: (queryInterface) => {
    return queryInterface.dropTable('api_keys')
  }
}
