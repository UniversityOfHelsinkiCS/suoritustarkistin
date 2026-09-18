/// <reference types="Cypress" />

/**
 * The API keys admin page. The endpoints behind it are covered by the node:test suites; what
 * only Cypress can see is the form, the table, and the token being shown exactly once.
 */

describe('API keys', () => {
  beforeEach(() => {
    cy.request('/api/seed/no-entries')
    cy.login('admin')
    cy.visit('/api-keys')
  })

  it('creates a key, shows the token once, and lists it by prefix', () => {
    cy.get('[data-cy=add-api-key-button]').click()
    cy.get('[data-cy=api-key-name]').type('courses.mooc.fi production')
    cy.get('[data-cy=create-api-key]').click()

    cy.get('[data-cy=created-token]').should('contain', 'suotar_')
    cy.contains('This is the only time it is shown')

    cy.get('[data-cy=api-key-grid]').contains('courses.mooc.fi production')
    cy.get('[data-cy=api-key-grid]').contains('Active')

    // The table shows the prefix only, and the plaintext does not survive a reload.
    cy.get('[data-cy=created-token]')
      .invoke('text')
      .then((shown) => {
        const token = shown.match(/suotar_[A-Za-z0-9_-]+/)[0]
        cy.contains('Done').click()
        cy.get('[data-cy=created-token]').should('not.exist')
        cy.reload()
        cy.get('[data-cy=api-key-grid]').should('be.visible').should('not.contain', token)
      })
  })

  it('revokes a key', () => {
    cy.get('[data-cy=add-api-key-button]').click()
    cy.get('[data-cy=api-key-name]').type('to be revoked')
    cy.get('[data-cy=create-api-key]').click()

    cy.get('[data-cy=api-key-grid]').contains('Active')
    cy.get('[data-cy^=revoke-api-key-]').click()
    cy.get('[data-cy=api-key-grid]').contains('Revoked')
    cy.get('[data-cy^=revoke-api-key-]').should('not.exist')
  })
})
