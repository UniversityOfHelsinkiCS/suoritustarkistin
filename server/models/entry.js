'use strict'
module.exports = (sequelize, DataTypes) => {
  const Entry = sequelize.define(
    'entries',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true
      },
      personId: DataTypes.STRING,
      verifierPersonId: DataTypes.STRING,
      courseUnitRealisationId: DataTypes.STRING,
      courseUnitRealisationName: DataTypes.JSONB,
      assessmentItemId: DataTypes.STRING,
      completionDate: DataTypes.DATE,
      completionLanguage: DataTypes.STRING,
      courseUnitId: DataTypes.STRING,
      gradeScaleId: DataTypes.STRING,
      gradeId: DataTypes.STRING,
      sent: DataTypes.DATE,
      registered: DataTypes.BOOLEAN,
      senderId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      errors: DataTypes.JSONB,
      missingEnrolment: {
        type: DataTypes.VIRTUAL,
        get() {
          return !(this.courseUnitId && this.courseUnitRealisationId && this.assessmentItemId)
        }
      },
      rawEntryId: {
        type: DataTypes.INTEGER,
        unique: true
      }
    }, {})
  Entry.associate = (models) => {
    Entry.belongsTo(models.raw_entries, { foreignKey: 'rawEntryId', as: 'rawEntry' })
    Entry.belongsTo(models.users, { foreignKey: 'senderId', as: 'sender', allowNull: true })
  }
  Entry.getUnsentBatchCount = async () => {
    const result = await sequelize.query(`
    SELECT COUNT(*) FROM(
      SELECT raw_entries."batchId"
        FROM entries
        INNER JOIN raw_entries ON raw_entries.id=entries."rawEntryId"
        WHERE "courseUnitId" IS NOT NULL
          AND "courseUnitRealisationId" IS NOT NULL
          AND "assessmentItemId" IS NOT NULL
          AND sent IS NULL
        GROUP BY raw_entries."batchId"
    ) as dummy`)
    return result[0][0].count
  }

  return Entry
}
