'use strict'
module.exports = (sequelize, DataTypes) => {
  const Reports = sequelize.define('reports', {
    fileName: DataTypes.STRING,
    data: DataTypes.TEXT
  })
  Reports.associate = (models) => {
    Reports.hasMany(models.Credits)
  }
  return Reports
}
