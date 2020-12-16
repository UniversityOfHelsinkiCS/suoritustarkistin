'use strict'
module.exports = (sequelize, DataTypes) => {
    const Entry = sequelize.define(
        'entries',
        {
            personId: DataTypes.STRING,
            verifierPersonId: DataTypes.STRING,
            courseUnitRealisationId: DataTypes.STRING,
            assessmentItemId: DataTypes.STRING,
            completionDate: DataTypes.DATE,
            completionLanguage: DataTypes.STRING,
            hasSent: DataTypes.BOOLEAN,
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
        Entry.belongsTo(models.raw_entries)
    }
    return Entry
}
