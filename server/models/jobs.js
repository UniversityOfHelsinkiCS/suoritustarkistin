'use strict'
module.exports = (sequelize, DataTypes) => {
  const Jobs = sequelize.define(
    'jobs',
    {
      courseId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'courses',
          key: 'id'
        }
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      schedule: DataTypes.STRING,
      active: DataTypes.BOOLEAN
    },
    {}
  )

  return Jobs
}
