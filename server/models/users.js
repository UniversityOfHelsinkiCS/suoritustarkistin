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

  return Users
}
