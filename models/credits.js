'use strict';
module.exports = (sequelize, DataTypes) => {
  const Credits = sequelize.define('Credits', {
    studentId: DataTypes.STRING,
    courseId: DataTypes.STRING,
    isInOodikone: DataTypes.BOOLEAN
  }, {});
  Credits.associate = function(models) {
    // associations can be defined here
  };
  return Credits;
};