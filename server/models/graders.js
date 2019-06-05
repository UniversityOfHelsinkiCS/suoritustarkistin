'use strict'
module.exports = (sequelize, DataTypes) => {
  const Graders = sequelize.define(
    'graders',
    {
      name: DataTypes.STRING,
      identityCode: DataTypes.STRING
    },
    {}
  )

  return Graders
}
