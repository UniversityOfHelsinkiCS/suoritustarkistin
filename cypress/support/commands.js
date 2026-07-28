/// <reference types="cypress" />

import { logout, setHeaders } from '../../client/utils/mockHeaders'

/**
 * Logs in as specified user.
 * @param {string} uid Uid of user to login as
 */
Cypress.Commands.add('login', (uid) => {
  setHeaders(uid)
  cy.log(`Logged in as ${uid}`)
})

Cypress.Commands.add('logout', () => {
  logout()
  cy.log(`Logged user out`)
})
