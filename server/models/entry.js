'use strict'
module.exports = (sequelize, DataTypes) => {
    const Entry = sequelize.define(
        'entries',
        {
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
            senderId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            errors: DataTypes.JSONB
    }, {})
    Entry.associate = (models) => {
        Entry.belongsTo(models.raw_entries, {foreignKey: 'rawEntryId', as: 'rawEntry'})
        Entry.belongsTo(models.users, {foreignKey: 'senderId', as: 'sender', allowNull: true})
    }
    return Entry
}
