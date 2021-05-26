/// <reference types="Cypress" />

describe('SIS form validation', () => {

  describe("Validation prevents submission of invalid data", () => {
    it('when pasted data is invalid', () => {
      cy.initializeUsersAndCourses()
      cy.asAdmin().visit('')
      cy.get('[data-cy=adminmode-enable]').click()
      cy.get('[data-cy=sis-copypaste]').should('be.visible').click()
      cy.get('[data-cy=sis-create-report-button]').should('be.disabled')  
      cy.get('[data-cy=sisPastefield]').type(
        '010000002;7;2,2;se\n011000002;;2,0\n011100009\n011110002;;;fi',
        { delay: 1 }
      )
      cy.get('#sisDatePicker')
        .clear()
        .type('5.7.2019')
  
      cy.get('[data-cy=sisGraderSelection]')
        .click()
        .children()
        .contains('grader')
        .click()
  
      cy.get('[data-cy=sisCourseSelection]')
        .click()
        .children()
        .contains('Valid course 3 (TKT10003)')
        .click()
  
      cy.get('[data-cy=sis-create-report-button]').should('be.disabled')
    })
  
    it('when there are missing fields', () => {
      cy.initializeUsersAndCourses()
      cy.asAdmin().visit('')
      cy.get('[data-cy=adminmode-enable]').click()
      cy.get('[data-cy=sis-copypaste]').should('be.visible').click()
      cy.get('[data-cy=sis-create-report-button]').should('be.disabled')  
  
      // missing course
      cy.get('[data-cy=sisPastefield]').type(
        '010000003;2;5;fi\n011000002;2;2,0\n011100009;2\n011110002;2;;fi',
        { delay: 1 }
      )
      cy.get('#sisDatePicker')
        .clear()
        .type('12.7.2020')
  
      cy.get('[data-cy=sis-create-report-button]').should('be.disabled')
      cy.get('[data-cy=sisGraderSelection]')
        .click()
        .children()
        .contains('grader')
        .click()
      cy.get('[data-cy=sis-create-report-button]').should('be.disabled')
      cy.get('[data-cy=sisCourseSelection]')
        .click()
        .children()
        .contains('Valid course 1 (TKT10001)')
        .click()
      cy.get('[data-cy=sis-create-report-button]').should('not.be.disabled')
  
      // missing data
      cy.get('[data-cy=sisPastefield]').clear()
      cy.get('[data-cy=sis-create-report-button]').should('be.disabled')
      cy.get('[data-cy=sisPastefield]').type(
        '010000003;2;5;fi\n011000002;2;2,0\n011100009;2\n011110002;2;;fi',
        { delay: 1 }
      )
      cy.get('[data-cy=sis-create-report-button]').should('not.be.disabled')
  
      // missing date
      cy.get('#sisDatePicker')
        .clear()
      cy.get('[data-cy=sis-create-report-button]').should('be.disabled')
      cy.get('#sisDatePicker')
        .clear()
        .type('21.21.2021')
      cy.get('[data-cy=sis-create-report-button]').should('not.be.disabled')
    })  
  })  
})
