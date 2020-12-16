'use strict'
module.exports = (sequelize, DataTypes) => {
    const RawEntry = sequelize.define(
        'raw_entries',
        {
            studentNumber: DataTypes.STRING,
            batchId: DataTypes.STRING, // To identify which entries sent with same submission
            grade: DataTypes.STRING,
            credits: DataTypes.STRING, // Credits as String??
            language: DataTypes.STRING,
            attainmentDate: DataTypes.DATE,
            graderId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            reporterId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            course: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'courses',
                    key: 'id'
                }
            }
        }, {})
        RawEntry.associate = (models) => {
            RawEntry.hasOne(models.entries)
        }
    return RawEntry
}
