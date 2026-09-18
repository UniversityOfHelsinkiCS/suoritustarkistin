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

/**
 * Opens the admin "Tools" dropdown in the navbar.
 */
Cypress.Commands.add('openToolsMenu', () => {
  cy.get('[data-cy=nav-tools]').click()
})

/**
 * Flips the admin-mode switch, which lives in the "Tools" dropdown.
 */
Cypress.Commands.add('toggleAdminMode', () => {
  cy.openToolsMenu()
  cy.get('[data-cy=adminmode-enable]').click()
  cy.get('body').type('{esc}')
  cy.wait(500)
})
