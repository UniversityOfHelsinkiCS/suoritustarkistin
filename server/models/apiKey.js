/**
 * A machine credential. Revocation is a soft delete, and several keys can be active at
 * once, which is what makes rotation zero-downtime.
 */
module.exports = (sequelize, DataTypes) => {
  const ApiKey = sequelize.define(
    'api_keys',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      // Which system the credential was issued to, e.g. 'moocfi'.
      client: {
        type: DataTypes.STRING,
        allowNull: false
      },
      tokenHash: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      prefix: {
        type: DataTypes.STRING,
        allowNull: false
      },
      createdById: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' }
      },
      revokedById: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' }
      },
      revokedAt: DataTypes.DATE,
      expiresAt: DataTypes.DATE,
      lastUsedAt: DataTypes.DATE,
      active: {
        type: DataTypes.VIRTUAL,
        get() {
          if (this.revokedAt) return false
          return !this.expiresAt || this.expiresAt > new Date()
        }
      }
    },
    {}
  )

  ApiKey.associate = (models) => {
    ApiKey.belongsTo(models.users, { foreignKey: 'createdById', as: 'createdBy', onDelete: 'SET NULL' })
    ApiKey.belongsTo(models.users, { foreignKey: 'revokedById', as: 'revokedBy', onDelete: 'SET NULL' })
  }

  return ApiKey
}
