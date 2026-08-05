/// <reference types="Cypress" />

describe('Form validation', () => {
  before(function () {
    cy.request('api/seed/all')
  })

  describe('Validation prevents submission of invalid data', () => {
    it('when pasted data is invalid', () => {
      cy.login('admin').visit('')
      cy.get('[data-cy=adminmode-enable]').click().wait(500)
      cy.get('[data-cy=copypaste]').should('be.visible').click()
      cy.get('[data-cy=confirm-sending-button]').should('be.disabled')
      cy.get('[data-cy=paste-field]').type('010000002;7;2,2;se\n011000002;;2,0\n011100009\n011110002;;;fi', {
        delay: 1
      })
      cy.get('#date-picker').clear().type('5.7.2019')

      cy.get('[data-cy=grader-selection]').click().children().contains('grader').click()

      cy.get('[data-cy=course-selection]').click().children().contains('Ohjelmoinnin perusteet (TKT10002)').click()

      cy.get('[data-cy=confirm-sending-button]').should('be.disabled')
      cy.logout()
    })

    it('when there are missing fields', () => {
      cy.login('admin').visit('')
      cy.get('[data-cy=adminmode-enable]').click().wait(500)
      cy.get('[data-cy=copypaste]').should('be.visible').click()
      cy.get('[data-cy=confirm-sending-button]').should('be.disabled')

      // missing course
      cy.get('[data-cy=paste-field]').type('010000003;2;5;fi\n011000002;2;2,0\n011100009;2\n011110002;2;;fi', {
        delay: 1
      })
      cy.get('#date-picker').clear().type('12.7.2020')

      cy.get('[data-cy=grader-selection]').click().children().contains('grader').click()
      cy.get('[data-cy=confirm-sending-button]').should('be.disabled')
      cy.get('[data-cy=course-selection]')
        .click()
        .children()
        .contains('Tietorakenteet ja algoritmit I (TKT200011)')
        .click()
      cy.get('[data-cy=confirm-sending-button]').should('not.be.disabled')

      // missing data
      cy.get('[data-cy=paste-field]').clear()
      cy.get('[data-cy=confirm-sending-button]').should('be.disabled')
      cy.get('[data-cy=course-selection]')
        .click()
        .children()
        .contains('Tietorakenteet ja algoritmit I (TKT200011)')
        .click()
      cy.get('[data-cy=grader-selection]').click().children().contains('grader').click()
      cy.get('[data-cy=paste-field]').type('010000003;2;5;fi\n011000002;2;2,0\n011100009;2\n011110002;2;;fi', {
        delay: 1
      })
      cy.get('[data-cy=confirm-sending-button]').should('not.be.disabled')
      cy.logout()
    })
  })
})

describe('Bachelor thesis form validation', () => {
  before(function () {
    cy.request('api/seed/all')
  })

  describe('when logged in as user with no kandi grader', () => {
    it('kandi tab should not be visible', () => {
      cy.login('grader').visit('')
      cy.get('[data-cy=copypaste-kandi]').should('not.exist')
    })
  })

  describe('when logged in as kandi grader', () => {
    before(function () {
      cy.request('api/seed/bsc_thesis')
    })

    beforeEach(() => {
      // Cypress >=12 resets the page between tests (testIsolation), so the login and
      // navigation this suite used to do once in `before` must happen per test.
      cy.login('grader').visit('')
      cy.get('[data-cy=copypaste-kandi]').click()
      cy.get('[data-cy=paste-field]').clear()
      cy.get('[data-cy=grader-selection]').click().children().contains('grader').click()
    })

    it('kandi tab should be visible', () => {
      cy.get('[data-cy=course-selection]').contains('Kandidaatin tutkielma')
      cy.get('[data-cy=userguide]').contains('Reporting bachelor thesis completions through Suotar')
    })

    it('form is submittable with valid data and correct rows are displayed', () => {
      cy.get('[data-cy=paste-field]').type('010000003;3;;fi\n011000002;4;\n011100009;5\n011110002;5;;fi', { delay: 1 })

      cy.get('[data-cy=new-report-table] > tbody').children().should('have.length', 16)
      cy.get('[data-cy=confirm-sending-button]').should('not.be.disabled')
    })

    it('emptying the paste field keeps the course pinned', () => {
      // Emptying the paste field resets the whole form, courseId included. The kandi
      // tab has to re-pin the thesis course instead of leaving the selection blank.
      cy.get('[data-cy=paste-field]').type('011000002;5;;fi', { delay: 1 })
      cy.get('[data-cy=paste-field]').clear()
      cy.get('[data-cy=course-selection]').contains('Kandidaatin tutkielma')

      cy.get('[data-cy=paste-field]').type('011000002;5;;fi', { delay: 1 })
      cy.get('[data-cy=new-report-table] > tbody').children().should('have.length', 4)
    })

    it('no extras when completion in english or opt-out', () => {
      cy.get('[data-cy=paste-field]').type('010000003;3;;en\n011000002;5;;fi;;x;x;x', { delay: 1 })
      cy.get('[data-cy=new-report-table] > tbody').children().should('have.length', 2)
      cy.get('[data-cy=confirm-sending-button]').should('not.be.disabled')
    })

    it('opt-out äidinkielinen viestintä', () => {
      cy.get('[data-cy=paste-field]').type('011000002;5;;fi;;x', { delay: 1 })
      cy.get('[data-cy=new-report-table] > tbody').children().should('have.length', 3)
      cy.get('[data-cy=new-report-table] > tbody').should('not.contain', 'Äidinkielinen viestintä')
      cy.get('[data-cy=confirm-sending-button]').should('not.be.disabled')
    })

    it('opt-out kypsyysnäyte', () => {
      cy.get('[data-cy=paste-field]').type('011000002;5;;fi;;;x', { delay: 1 })
      cy.get('[data-cy=new-report-table] > tbody').children().should('have.length', 3)
      cy.get('[data-cy=new-report-table] > tbody').should('not.contain', 'Kypsyysnäyte')
      cy.get('[data-cy=confirm-sending-button]').should('not.be.disabled')
    })

    it('opt-out tutkimustiedonhaku', () => {
      cy.get('[data-cy=paste-field]').type('011000002;5;;fi;;;;x', { delay: 1 })
      cy.get('[data-cy=new-report-table] > tbody').children().should('have.length', 3)
      cy.get('[data-cy=new-report-table] > tbody').should('not.contain', 'Tutkimustiedonhaku')
      cy.get('[data-cy=confirm-sending-button]').should('not.be.disabled')
    })

    it('form is not submittable with invalid data', () => {
      cy.get('[data-cy=paste-field]').type('010000002;7;2,2;se\n011000002;;2,0\n011100009\n011110002;;;fi', {
        delay: 1
      })
      cy.get('[data-cy=new-report-table] > tbody').children().should('have.length', 16)
      cy.get('[data-cy=confirm-sending-button]').should('be.disabled')
    })
  })
})
