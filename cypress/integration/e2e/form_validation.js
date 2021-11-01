/// <reference types="Cypress" />

describe('Form validation', () => {
  before(function () {
    cy.request('api/seed/all')
  })

  describe("Validation prevents submission of invalid data", () => {
    it('when pasted data is invalid', () => {
      cy.login('admin').visit('')
      cy.get('[data-cy=adminmode-enable]').click()
      cy.get('[data-cy=copypaste]').should('be.visible').click()
      cy.get('[data-cy=create-report-button]').should('be.disabled')
      cy.get('[data-cy=paste-field]').type(
        '010000002;7;2,2;se\n011000002;;2,0\n011100009\n011110002;;;fi',
        { delay: 1 }
      )
      cy.get('#date-picker')
        .clear()
        .type('5.7.2019')

      cy.get('[data-cy=grader-selection]')
        .click()
        .children()
        .contains('grader')
        .click()

      cy.get('[data-cy=course-selection]')
        .click()
        .children()
        .contains('Ohjelmoinnin perusteet (TKT10002)')
        .click()

      cy.get('[data-cy=create-report-button]').should('be.disabled')
      cy.logout()
    })

    // Fix me later
    it('when there are missing fields', () => {
      cy.login('admin').visit('')
      cy.get('[data-cy=adminmode-enable]').click()
      cy.get('[data-cy=copypaste]').should('be.visible').click()
      cy.get('[data-cy=create-report-button]').should('be.disabled')

      // missing course
      cy.get('[data-cy=paste-field]').type(
        '010000003;2;5;fi\n011000002;2;2,0\n011100009;2\n011110002;2;;fi',
        { delay: 1 }
      )
      cy.get('#date-picker')
        .clear()
        .type('12.7.2020')

      cy.get('[data-cy=grader-selection]')
        .click()
        .children()
        .contains('grader')
        .click()
      cy.get('[data-cy=create-report-button]').should('be.disabled')
      cy.get('[data-cy=course-selection]')
        .click()
        .children()
        .contains('Tietorakenteet ja algoritmit I (TKT200011)')
        .click()
      cy.get('[data-cy=create-report-button]').should('not.be.disabled')

      // missing data
      cy.get('[data-cy=paste-field]').clear()
      cy.get('[data-cy=create-report-button]').should('be.disabled')
      cy.get('[data-cy=course-selection]')
        .click()
        .children()
        .contains('Tietorakenteet ja algoritmit I (TKT200011)')
        .click()
      cy.get('[data-cy=grader-selection]')
        .click()
        .children()
        .contains('grader')
        .click()
      cy.get('[data-cy=paste-field]').type(
        '010000003;2;5;fi\n011000002;2;2,0\n011100009;2\n011110002;2;;fi',
        { delay: 1 }
      )
      cy.get('[data-cy=create-report-button]').should('not.be.disabled')
      cy.logout()
    })
  })
})
