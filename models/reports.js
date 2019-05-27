'use strict'
module.exports = (sequelize, DataTypes) => {
  const Reports = sequelize.define('reports', {
    fileName: DataTypes.STRING,
    data: DataTypes.TEXT,
    lastDownloaded: DataTypes.DATE
  })
  Reports.associate = (models) => {
    Reports.hasMany(models.credits)
  }
  return Reports
}
