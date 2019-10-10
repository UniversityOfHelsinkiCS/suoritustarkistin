'use strict'
module.exports = (sequelize, DataTypes) => {
  const Courses = sequelize.define('courses', {
    name: DataTypes.STRING,
    courseCode: DataTypes.STRING,
    language: DataTypes.STRING,
    credits: DataTypes.STRING,
    graderId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  })

  return Courses
}
