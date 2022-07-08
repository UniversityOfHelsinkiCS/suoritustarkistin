
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
      graderId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      schedule: DataTypes.STRING,
      active: DataTypes.BOOLEAN,
      slug: DataTypes.STRING,
      useManualCompletionDate: DataTypes.BOOLEAN
    },
    {}
  )

  return Jobs
}
