'use strict'
module.exports = (sequelize, DataTypes) => {
  const Users = sequelize.define(
    'users',
    {
      uid: DataTypes.STRING,
      name: DataTypes.STRING,
      employeeId: DataTypes.STRING,
      email: DataTypes.STRING,
      isGrader: DataTypes.BOOLEAN,
      isAdmin: DataTypes.BOOLEAN
    },
    {}
  )

  Users.associate = function (models) {
    Users.belongsToMany(models.courses, {
      onDelete: 'SET NULL',
      through: 'users_courses',
      foreignKey: 'userId',
      as: 'courses'
    })    
  }

  return Users
}
