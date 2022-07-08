
module.exports = (sequelize, DataTypes) => {
  const Courses = sequelize.define('courses', {
    name: DataTypes.STRING,
    courseCode: DataTypes.STRING,
    language: DataTypes.STRING,
    credits: DataTypes.STRING,
    autoSeparate: DataTypes.BOOLEAN,
    gradeScale: DataTypes.STRING,
    useAsExtra: DataTypes.BOOLEAN
  })

  Courses.associate = function (models) {
    Courses.belongsToMany(models.users, {
      onDelete: 'SET NULL',
      through: 'users_courses',
      foreignKey: 'courseId',
      as: 'graders'
    })
  }

  return Courses
}
