module.exports = (sequelize, DataTypes) => {
  const UsersCourses = sequelize.define(
    'users_courses',
    {
      userId: DataTypes.INTEGER,
      courseId: DataTypes.INTEGER
    },
    {
      underscored: true
    }
  )

  UsersCourses.associate = function (models) {
    UsersCourses.belongsTo(models.users, { foreignKey: 'userId' })
    UsersCourses.belongsTo(models.courses, { foreignKey: 'courseId' })
  }

  return UsersCourses
}