'use strict'
module.exports = (sequelize, DataTypes) => {
  const Reports = sequelize.define('reports', {
    fileName: DataTypes.STRING,
    data: DataTypes.TEXT,
    lastDownloaded: DataTypes.DATE,
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
    }
  })
  Reports.associate = (models) => {
    Reports.hasMany(models.credits)
  }
  return Reports
}
