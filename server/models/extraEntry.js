const { SEND_STATES } = require('../utils/enums')

/**
 * This model represents course unit attainment (erilliskirjaus) in Sisu. See:
 * https://sis-helsinki.funidata.fi/ori/docs/index.html#_courseunitattainment
 */
module.exports = (sequelize, DataTypes) => {
  const ExtraEntry = sequelize.define(
    'extra_entries',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true
      },
      personId: DataTypes.STRING,
      studentName: DataTypes.STRING,
      studyRightId: DataTypes.STRING,
      verifierPersonId: DataTypes.STRING,
      completionDate: DataTypes.DATE,
      completionLanguage: DataTypes.STRING,
      courseUnitId: DataTypes.STRING,
      gradeScaleId: DataTypes.STRING,
      gradeId: DataTypes.STRING,
      sent: DataTypes.DATE,
      // How far the attainment got on its way to Sisu. ATTEMPTED is written before the request
      // leaves, so an outcome that never arrives is not mistaken for never having been sent.
      sendState: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'NOT_SENT',
        validate: {
          isIn: [SEND_STATES]
        }
      },
      registered: {
        type: DataTypes.STRING,
        validate: {
          isIn: [['NOT_REGISTERED', 'REGISTERED']]
        },
        defaultValue: 'NOT_REGISTERED'
      },
      senderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      errors: DataTypes.JSONB
    },
    {}
  )
  ExtraEntry.associate = (models) => {
    ExtraEntry.belongsTo(models.raw_entries, { foreignKey: 'rawEntryId', as: 'rawEntry' })
    ExtraEntry.belongsTo(models.users, { foreignKey: 'senderId', as: 'sender', onDelete: 'SET NULL' })
  }
  return ExtraEntry
}
