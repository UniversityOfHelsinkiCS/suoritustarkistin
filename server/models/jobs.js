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
      schedule: DataTypes.STRING,
      active: DataTypes.BOOLEAN,
      slug: DataTypes.STRING
    },
    {}
  )

  return Jobs
}
