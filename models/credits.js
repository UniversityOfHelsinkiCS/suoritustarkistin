'use strict';
module.exports = (sequelize, DataTypes) => {
  const Credits = sequelize.define('credits', {
    studentId: DataTypes.STRING,
    courseId: DataTypes.STRING,
    moocId: DataTypes.INTEGER,
    isInOodikone: DataTypes.BOOLEAN
  }, {});
  Credits.associate = function(models) {
    // associations can be defined here
  };
  return Credits;
};