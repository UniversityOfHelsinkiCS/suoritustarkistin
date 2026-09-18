'use strict'

module.exports = {
  /**
   * Identifies the courses.mooc.fi import an entry came from. Not unique on purpose: a retry
   * after the submission cooldown creates a second entry under the same id.
   */
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('raw_entries', 'moocfiRequestItemId', {
      type: Sequelize.STRING,
      allowNull: true
    })
    await queryInterface.addIndex('raw_entries', ['moocfiRequestItemId'])
  },
  down: (queryInterface) => queryInterface.removeColumn('raw_entries', 'moocfiRequestItemId')
}
