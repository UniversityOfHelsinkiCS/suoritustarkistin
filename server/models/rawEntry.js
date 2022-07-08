
module.exports = (sequelize, DataTypes) => {
  const RawEntry = sequelize.define(
    'raw_entries',
    {
      studentNumber: DataTypes.STRING,
      batchId: DataTypes.STRING, // To identify which entries sent with same submission
      grade: DataTypes.STRING,
      credits: DataTypes.STRING, // Credits as String??
      language: DataTypes.STRING,
      attainmentDate: DataTypes.DATE, // This date should not be used, entry mankel might adjust the date
      moocUserId: DataTypes.INTEGER,
      moocCompletionId: DataTypes.STRING,
      registeredToMooc: DataTypes.DATE,
      graderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      reporterId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      courseId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'courses',
          key: 'id'
        }
      }
    },
    {}
  )
  RawEntry.getBatchCount = function (filters) {
    return this.findAll({
      where: {
        ...filters
      },
      attributes: [[sequelize.literal('COUNT(DISTINCT "batchId")'), 'count']],
      include: [
        { association: 'entry', attributes: [] },
        { association: 'extraEntry', attributes: [] }
      ],
      raw: true
    })
  }
  RawEntry.deleteOrphans = async function (batchId) {
    const orphans = await this.findAll({
      where: {
        batchId,
        [sequelize.Sequelize.Op.and]: [{ '$entry.id$': null }, { '$extraEntry.id$': null }]
      },
      include: [
        { association: 'entry', attributes: [] },
        { association: 'extraEntry', attributes: [] }
      ],
      attributes: ['id'],
      raw: true
    })
    if (!orphans.length) return false
    return this.destroy({
      where: {
        id: orphans.map(({ id }) => id)
      }
    })
  }
  RawEntry.getByBatch = async function (batchId) {
    const rows = await this.findAll({
      where: { batchId },
      include: [{ association: 'entry' }, { association: 'extraEntry' }, { association: 'course' }]
    })

    return rows.map((row) => {
      const item = row.get({ plain: true })
      const { extraEntry, entry, ...rest } = item
      if (extraEntry && extraEntry.id) return { ...rest, entry: { ...extraEntry, type: 'EXTRA_ENTRY' } }
      return {
        ...rest,
        entry: { ...entry, type: 'ENTRY' }
      }
    })
  }

  RawEntry.associate = (models) => {
    RawEntry.hasOne(models.entries, { foreignKey: 'rawEntryId', as: 'entry', onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    RawEntry.hasOne(models.extra_entries, {
      foreignKey: 'rawEntryId',
      as: 'extraEntry',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    })
    RawEntry.belongsTo(models.users, { foreignKey: 'reporterId', as: 'reporter', onDelete: 'SET NULL' })
    RawEntry.belongsTo(models.users, { foreignKey: 'graderId', as: 'grader', onDelete: 'SET NULL' })
    RawEntry.belongsTo(models.courses, { foreignKey: 'courseId', as: 'course' })
  }
  return RawEntry
}
