
module.exports = (sequelize, DataTypes) => {
  const Credits = sequelize.define(
    'credits',
    {
      studentId: DataTypes.STRING,
      courseId: DataTypes.STRING,
      moocId: DataTypes.INTEGER,
      completionId: DataTypes.STRING,
      isInOodikone: DataTypes.BOOLEAN,
      reportId: DataTypes.INTEGER,
      grade: DataTypes.STRING,
      tier: DataTypes.INTEGER
    },
    {}
  )
  Credits.associate = function (models) {
    Credits.belongsTo(models.reports)
  }
  return Credits
}
