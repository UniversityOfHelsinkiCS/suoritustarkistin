describe('New entries can be added correctly', function () {
  beforeEach(function () {
    cy.request('/api/seed/no-entries')
  })

  it('When pasting (typing) completions with valid data, correct entries are created and sent to Sisu', () => {
    cy.login('admin').visit('')
    cy.get('[data-cy=adminmode-enable]').click().wait(500)

    cy.get('[data-cy=nav-new-report]').click()
    cy.get('[data-cy=copypaste]').should('be.visible').click()
    cy.get('[data-cy=confirm-sending-button]').should('be.disabled')
    cy.get('[data-cy=paste-field]').type('014979622;0;', {
      delay: 1
    })
    cy.get('#date-picker').clear().type('30.12.2020')
    cy.get('[data-cy=grader-selection]')
      .click()
      .children()
      .should('not.contain', 'admin')
      .should('not.contain', 'user')
      .contains('grader')
      .click()

    cy.get('[data-cy=course-selection]').click().children().contains('Ohjelmoinnin perusteet (TKT10002)').click()

    cy.get('[data-cy=confirm-sending-button]').should('not.be.disabled').click()

    cy.get('[data-cy=confirm-entries-table]').children().should('have.length', 1)
    cy.get('[data-cy=confirm-entries-table]').children().contains('014979622')
    cy.get('[data-cy=confirm-entries-table]').children().contains('Ohjelmoinnin perusteet')
    cy.get('[data-cy=confirm-entries-table]').children().contains('21.10.2021')

    cy.get('[data-cy=confirm-entries-send]').should('not.be.disabled')
    cy.get('[data-cy=confirm-entries-cancel]').should('not.be.disabled')

    cy.get('[data-cy=confirm-entries-send]').click()
    cy.get('[data-cy=confirm-entries-send-confirm]').click()

    cy.get('[data-cy=report-TKT10002]').contains('Ohjelmoinnin perusteet')
  })

  it('When adding entries cancel of confirmation will delete the report', () => {
    cy.login('admin').visit('')
    cy.get('[data-cy=adminmode-enable]').click().wait(500)

    cy.get('[data-cy=nav-new-report]').click()
    cy.get('[data-cy=copypaste]').should('be.visible').click()
    cy.get('[data-cy=confirm-sending-button]').should('be.disabled')
    cy.get('[data-cy=paste-field]').type('014979622;0;', {
      delay: 1
    })
    cy.get('#date-picker').clear().type('30.12.2020')
    cy.get('[data-cy=grader-selection]')
      .click()
      .children()
      .should('not.contain', 'admin')
      .should('not.contain', 'user')
      .contains('grader')
      .click()

    cy.get('[data-cy=course-selection]').click().children().contains('Ohjelmoinnin perusteet (TKT10002)').click()

    cy.get('[data-cy=confirm-sending-button]').should('not.be.disabled').click()

    cy.get('[data-cy=confirm-entries-send]').should('not.be.disabled')
    cy.get('[data-cy=confirm-entries-cancel]').should('not.be.disabled').click()
    cy.visit('/reports')
    cy.contains('No reports found')
  })

  it('When adding entries without enrolment nothing is sent to Sisu', () => {
    cy.login('admin').visit('')
    cy.get('[data-cy=adminmode-enable]').click().wait(500)

    cy.get('[data-cy=nav-new-report]').click()
    cy.get('[data-cy=copypaste]').should('be.visible').click()
    cy.get('[data-cy=confirm-sending-button]').should('be.disabled')
    cy.get('[data-cy=paste-field]').type('015448314;3', {
      delay: 1
    })
    cy.get('#date-picker').clear().type('30.12.2020')
    cy.get('[data-cy=grader-selection]')
      .click()
      .children()
      .should('not.contain', 'admin')
      .should('not.contain', 'user')
      .contains('grader')
      .click()

    cy.get('[data-cy=course-selection]').click().children().contains('Ohjelmoinnin jatkokurssi (TKT10003)').click()

    cy.get('[data-cy=confirm-sending-button]').should('not.be.disabled').click()

    cy.get('[data-cy=confirm-entries-table]').contains('Missing enrollment')
    cy.get('[data-cy=confirm-entries-table]').children().should('have.length', 1)
    cy.get('[data-cy=confirm-entries-table]').children().contains('015448314')
    cy.get('[data-cy=confirm-entries-table]').children().contains('30.12.2020')

    cy.get('[data-cy=confirm-entries-cancel]').should('not.be.disabled')
    cy.get('[data-cy=confirm-entries-send-missing-enrolment]').should('not.be.disabled').click()

    cy.get('[data-cy=report-TKT10003]').contains('NOT SENT')
    cy.get('[data-cy=report-TKT10003]').contains('1 MISSING ENROLLMENT')
  })
})

describe('New extra entries can be added correctly', function () {
  beforeEach(function () {
    cy.request('/api/seed/all')
  })

  it('When pasting (typing) completions with valid data, correct entries are created and sent to Sisu', () => {
    cy.login('admin').visit('')
    cy.get('[data-cy=adminmode-enable]').click().wait(500)

    cy.get('[data-cy=nav-new-report]').click()
    cy.get('[data-cy=copypaste-erilliskirjaus]').should('be.visible').click()

    cy.get('[data-cy=confirm-sending-button]').should('be.disabled')
    cy.get('[data-cy=paste-field]').type('015448314;hyv', {
      delay: 1
    })
    cy.get('#date-picker').clear().type('30.12.2020')
    cy.get('[data-cy=grader-selection]')
      .click()
      .children()
      .should('not.contain', 'admin')
      .should('not.contain', 'user')
      .contains('grader')
      .click()

    cy.get('[data-cy=course-selection]').click().children().contains('Versionhallinta (TKT21015)').click()

    cy.get('[data-cy=confirm-sending-button]').should('not.be.disabled').click()

    cy.get('[data-cy=confirm-entries-table]').children().should('have.length', 1)
    cy.get('[data-cy=confirm-entries-table]').children().contains('015448314')
    cy.get('[data-cy=confirm-entries-table]').children().contains('01.08.2021')
    cy.get('[data-cy=confirm-entries-table]').contains('Erilliskirjaus')

    cy.get('[data-cy=confirm-entries-cancel]').should('not.be.disabled')
    cy.get('[data-cy=confirm-entries-send]').should('not.be.disabled').click()
    cy.get('[data-cy=confirm-entries-send-confirm]').click()
  })
})
