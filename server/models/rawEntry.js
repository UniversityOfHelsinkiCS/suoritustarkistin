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
            isOpenUni: DataTypes.BOOLEAN,
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
            courseId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'courses',
                    key: 'id'
                }
            }
        }, {})
        RawEntry.associate = (models) => {
            RawEntry.hasOne(models.entries, {foreignKey: 'rawEntryId', as: 'entry', onDelete:'CASCADE', onUpdate:'CASCADE'})
            RawEntry.belongsTo(models.users, {foreignKey: 'reporterId', as: 'reporter'})
            RawEntry.belongsTo(models.users, {foreignKey: 'graderId', as: 'grader'})
            RawEntry.belongsTo(models.courses, {foreignKey: 'courseId', as: 'course'})
        }
    return RawEntry
}
