'use strict'

// A frozen copy of the states as they were when this ran; the live list is in
// server/utils/enums.js, and a later state must arrive in a later migration.
const SEND_STATES = ['NOT_SENT', 'ATTEMPTED', 'ACCEPTED', 'REJECTED']

const TABLES = ['entries', 'extra_entries']

/**
 * Where an attainment got to on its way to Sisu. Previously inferred from `sent` and `errors`,
 * which cannot tell "never offered to Sisu" from "offered, and Sisu never answered" -- the one
 * distinction that decides whether resending risks a duplicate.
 *
 * `errors` first: a rejection writes both, and a rejected attainment is not in Sisu.
 */
const backfill = (table) => `
  UPDATE "${table}" SET "sendState" =
    CASE WHEN "errors" IS NOT NULL THEN 'REJECTED'
         WHEN "sent" IS NOT NULL THEN 'ACCEPTED'
         ELSE 'NOT_SENT' END
`

/**
 * Six statements over two tables, in one transaction: umzug runs migrations bare, so a failure
 * partway would leave a half-added column that the retry on the next boot cannot get past.
 */
module.exports = {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      for (const table of TABLES) {
        await queryInterface.addColumn(
          table,
          'sendState',
          {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'NOT_SENT'
          },
          { transaction }
        )
        await queryInterface.sequelize.query(backfill(table), { transaction })
        // The model's isIn does not run for bulkUpdate or raw SQL, the backfill above included.
        await queryInterface.addConstraint(table, {
          fields: ['sendState'],
          type: 'check',
          name: `${table}_sendState_ck`,
          where: { sendState: SEND_STATES },
          transaction
        })
      }
    }),
  down: async (queryInterface) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      for (const table of TABLES) {
        await queryInterface.removeConstraint(table, `${table}_sendState_ck`, { transaction })
        await queryInterface.removeColumn(table, 'sendState', { transaction })
      }
    })
}
