'use strict'

module.exports = {
  /**
   * The verifier is Suotar's own record of who stood behind a completion; Sisu takes the
   * acceptor from the realisation's responsible persons instead. A courses.mooc.fi import has
   * no person to name, so the column has to allow none.
   *
   * One-way: those imports leave the column NULL, so the constraint cannot be restored.
   */
  up: (queryInterface, Sequelize) =>
    queryInterface.changeColumn('entries', 'verifierPersonId', { type: Sequelize.STRING, allowNull: true }),
  down: () => {}
}
