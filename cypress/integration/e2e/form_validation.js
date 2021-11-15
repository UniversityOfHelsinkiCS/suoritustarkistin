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

describe("Bachelor thesis form validation", () => {
  before(function () {
    cy.request('api/seed/all')
  })

  describe("when logged in as user with no kandi grader", () => {
    it("kandi tab should not be visible", () => {
      cy.login('grader').visit('')
      cy.get('[data-cy=copypaste-kandi]').should('not.exist')
    })
  })

  describe("when logged in as kandi grader", () => {
    before(function () {
      cy.request('api/seed/bsc_thesis')
      cy.login('grader').visit('')
      cy.get('[data-cy=copypaste-kandi]').click()
    })

    beforeEach(() => {
      cy.get('[data-cy=paste-field]').clear()
      cy.get('[data-cy=course-selection]')
        .click()
        .children()
        .contains('Kandidaatin tutkielma')
        .click()
      cy.get('[data-cy=grader-selection]')
        .click()
        .children()
        .contains('grader')
        .click()
    })

    it("kandi tab should be visible", () => {
      cy.get('[data-cy=course-selection] > [role=listbox]').children().should('have.length', 4)
      cy.get('[data-cy=course-selection]').contains('Kandidaatin tutkielma')
      cy.get('[data-cy=userguide').contains('Reporting bachelor thesis completions through Suotar')
    })

    it("form is submittable with valid data and correct rows are displayed", () => {
      cy.get('[data-cy=paste-field]').type(
        '010000003;3;;fi\n011000002;4;\n011100009;5\n011110002;5;;fi',
        { delay: 1 }
      )

      cy.get('[data-cy=new-report-table] > tbody').children().should('have.length', 16)
      cy.get('[data-cy=create-report-button]').should('not.be.disabled')
    })

    it("no extras when completion in english or opt-out", () => {
      cy.get('[data-cy=paste-field]').type(
        '010000003;3;;en\n011000002;5;;fi;;x;x;x',
        { delay: 1 }
      )
      cy.get('[data-cy=new-report-table] > tbody').children().should('have.length', 2)
      cy.get('[data-cy=create-report-button]').should('not.be.disabled')
    })

    it("opt-out äidinkielinen viestintä", () => {
      cy.get('[data-cy=paste-field]').type(
        '011000002;5;;fi;;x',
        { delay: 1 }
      )
      cy.get('[data-cy=new-report-table] > tbody').children().should('have.length', 3)
      cy.get('[data-cy=new-report-table] > tbody').should('not.contain', 'Äidinkielinen viestintä')
      cy.get('[data-cy=create-report-button]').should('not.be.disabled')
    })

    it("opt-out kypsyysnäyte", () => {
      cy.get('[data-cy=paste-field]').type(
        '011000002;5;;fi;;;x',
        { delay: 1 }
      )
      cy.get('[data-cy=new-report-table] > tbody').children().should('have.length', 3)
      cy.get('[data-cy=new-report-table] > tbody').should('not.contain', 'Kypsyysnäyte')
      cy.get('[data-cy=create-report-button]').should('not.be.disabled')
    })

    it("opt-out tutkimustiedonhaku", () => {
      cy.get('[data-cy=paste-field]').type(
        '011000002;5;;fi;;;;x',
        { delay: 1 }
      )
      cy.get('[data-cy=new-report-table] > tbody').children().should('have.length', 3)
      cy.get('[data-cy=new-report-table] > tbody').should('not.contain', 'Tutkimustiedonhaku')
      cy.get('[data-cy=create-report-button]').should('not.be.disabled')
    })

    it("form is not submittable with invalid data", () => {
      cy.get('[data-cy=paste-field]').type(
        '010000002;7;2,2;se\n011000002;;2,0\n011100009\n011110002;;;fi',
        { delay: 1 }
      )
      cy.get('[data-cy=new-report-table] > tbody').children().should('have.length', 16)
      cy.get('[data-cy=create-report-button]').should('be.disabled')
    })

  })
})