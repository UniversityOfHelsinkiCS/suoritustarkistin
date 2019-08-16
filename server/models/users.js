'use strict'
module.exports = (sequelize, DataTypes) => {
  const Users = sequelize.define(
    'users',
    {
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
