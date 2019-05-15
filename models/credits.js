'use strict';
module.exports = (sequelize, DataTypes) => {
  const Credits = sequelize.define('credits', {
    student_id: DataTypes.STRING,
    course_id: DataTypes.STRING,
    mooc_id: DataTypes.INTEGER,
    is_in_oodikone: DataTypes.BOOLEAN
  }, {});
  Credits.associate = function(models) {
    // associations can be defined here
  };
  return Credits;
};