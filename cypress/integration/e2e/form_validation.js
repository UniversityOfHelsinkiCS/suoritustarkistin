/// <reference types="Cypress" />

describe('Form validation', function() {
  beforeEach(function() {
    cy.server({
      onAnyRequest: (route, proxy) => {
        proxy.xhr.setRequestHeader('employeenumber', Cypress.env('ADMIN_EMPLOYEE_NUMBER'))
      }
    })

    cy.request('DELETE', '/api/seed/courses')
    cy.request('DELETE', '/api/seed/users')
    cy.request('DELETE', '/api/seed/reports')

    cy.request('POST', '/api/seed/users', {
      name: 'admin',
      employeeId: Cypress.env('ADMIN_EMPLOYEE_NUMBER'),
      uid: 'admin11',
      isAdmin: true,
      isGrader: true
    })
    cy.request('POST', '/api/seed/users', {
      name: 'grader',
      employeeId: Cypress.env('GRADER_EMPLOYEE_NUMBER'),
      uid: 'grader11',
      isAdmin: false,
      isGrader: true
    }).then((response) => {
      cy.request('POST', '/api/courses', {
        name: 'avoimen kurssi',
        courseCode: 'AYTKTTEST',
        language: 'fi',
        credits: '8,0',
        graders: [response.body.id]
      })
      cy.request('POST', '/api/courses', {
        name: 'tkt:n kurssi',
        courseCode: 'TKTTEST',
        language: 'en',
        credits: '8,0',
        graders: [response.body.id]
      })
    })

    cy.asGrader().visit('')
  })

  describe("Validation prevents submission of invalid data", () => {
    it('when pasted data is invalid', () => {
      cy.get('[data-cy=create-report-button]').should('be.disabled')
      cy.get('[data-cy=pastefield]').type(
        '010000002;7;2,2;se\n011000002;;2,0\n011100009\n011110002;;;fi',
        { delay: 1 }
      )
      cy.get('[data-cy=dateField]')
        .children()
        .clear()
        .type('5.7.2019')

      cy.get('[data-cy=graderSelection]')
        .click()
        .children()
        .contains('grader')
        .click()

      cy.get('[data-cy=courseSelection]')
        .click()
        .children()
        .contains('avoimen kurssi (AYTKTTEST)')
        .click()

      cy.get('[data-cy=create-report-button]').should('be.disabled')
    })

    it('when there are missing fields', () => {
      cy.get('[data-cy=create-report-button]').should('be.disabled')

      // missing course
      cy.get('[data-cy=pastefield]').type(
        '010000003;2;5;fi\n011000002;;2,0\n011100009\n011110002;;;fi',
        { delay: 1 }
      )
      cy.get('[data-cy=dateField]')
        .children()
        .clear()
        .type('5.7.2019')

      cy.get('[data-cy=create-report-button]').should('be.disabled')
      cy.get('[data-cy=graderSelection]')
        .click()
        .children()
        .contains('grader')
        .click()
      cy.get('[data-cy=create-report-button]').should('be.disabled')
      cy.get('[data-cy=courseSelection]')
        .click()
        .children()
        .contains('tkt:n kurssi (TKTTEST)')
        .click()
      cy.get('[data-cy=create-report-button]').should('not.be.disabled')

      // missing data
      cy.get('[data-cy=pastefield]').clear()
      cy.get('[data-cy=create-report-button]').should('be.disabled')
      cy.get('[data-cy=pastefield]').type(
        '010000003;2;5;fi\n011000002;;2,0\n011100009\n011110002;;;fi',
        { delay: 1 }
      )
      cy.get('[data-cy=create-report-button]').should('not.be.disabled')

      // missing date
      cy.get('[data-cy=dateField]')
        .children()
        .clear()
      cy.get('[data-cy=create-report-button]').should('be.disabled')
      cy.get('[data-cy=dateField]')
        .children()
        .clear()
        .type('5.7.2019')
      cy.get('[data-cy=create-report-button]').should('not.be.disabled')
    })

    it('when uploaded data is invalid', () => {
      cy.get('[data-cy=create-report-button]').should('be.disabled')
      cy.get('[data-cy=dragdrop]').click()
      cy.fixture('invalid.csv').then((content) => {
        cy.get('[data-cy=dropzone]').upload(content, 'invalid.csv')
      })
      cy.get('[data-cy=dateField]')
        .children()
        .clear()
        .type('5.7.2019')
      cy.get('[data-cy=graderSelection]')
        .click()
        .children()
        .contains('grader')
        .click()

      cy.get('[data-cy=courseSelection]')
        .click()
        .children()
        .contains('tkt:n kurssi (TKTTEST)')
        .click()
    })
  })

  describe("Separator is detected automatically", () => {
    const testSeparator = (data) => {
      cy.get('[data-cy=create-report-button]').should("be.disabled")
      cy.get('[data-cy=pastefield]').type(data, { delay: 1 })
      cy.get('[data-cy=create-report-button]').should("be.enabled")
      cy.get('[data-cy=pastefield]').clear()
    }

    beforeEach(() => {
      cy.get('[data-cy=courseSelection]')
      .click()
      .children()
      .contains('tkt:n kurssi (TKTTEST)')
      .click()
    })

    it("(;) Semicolon", () => testSeparator("010000003;2;5;fi\n011000002;;2,0\n011100009\n011110002;;;fi"))
    it("(|) Vertical line", () => testSeparator("010000003|2|5|fi\n011000002||2,0\n011100009\n011110002|||fi"))
    it("(\\t) Tab ", () => testSeparator("010000003\t2\t5\tfi\n011000002\t\t2,0\n011100009\n011110002\t\t\tfi"))
  })

  it('passes when uploaded csv contains dates', () => {
    cy.get('[data-cy=create-report-button]').should('be.disabled')
    cy.get('[data-cy=dragdrop]').click()
    cy.fixture('valid-with-dates.csv').then((content) => {
      cy.get('[data-cy=dropzone]').upload(content, 'valid-with-dates.csv')
    })

    cy.get('[data-cy=graderSelection]')
      .click()
      .children()
      .contains('grader')
      .click()

    cy.get('[data-cy=courseSelection]')
      .click()
      .children()
      .contains('tkt:n kurssi (TKTTEST)')
      .click()

    cy.contains("1.3.2020")
    cy.contains("1.4.2020")
    cy.contains("2.5.2020")

    cy.get('[data-cy=create-report-button]').should('be.enabled')
  })

})
