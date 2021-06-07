'use strict'
module.exports = (sequelize, DataTypes) => {
  const Courses = sequelize.define('courses', {
    name: DataTypes.STRING,
    courseCode: DataTypes.STRING,
    language: DataTypes.STRING,
    credits: DataTypes.STRING,
    isMooc: DataTypes.BOOLEAN,
    autoSeparate: DataTypes.BOOLEAN,
    gradeScale: DataTypes.STRING
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
