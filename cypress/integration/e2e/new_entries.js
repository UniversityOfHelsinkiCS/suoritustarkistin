
describe('New entries can be added correctly', function () {
  beforeEach(function () {
    cy.request('/api/seed/all')
  })

  it('When pasting (typing) completions with valid data, correct entries are created', () => {
    cy.login('admin').visit('')
    cy.get('[data-cy=adminmode-enable]').click()

    cy.get('[data-cy=nav-new-report]').click()
    cy.get('[data-cy=copypaste]').should('be.visible').click()
    cy.get('[data-cy=create-report-button]').should('be.disabled')
    cy.get('[data-cy=paste-field]').type(
      '011111111;0;',
      {
        delay: 1,
      }
    )
    cy.get('#date-picker').clear().type('30.12.2020')
    cy.get('[data-cy=grader-selection]')
      .click()
      .children()
      .should('not.contain', 'admin')
      .should('not.contain', 'user')
      .contains('grader')
      .click()

    cy.get('[data-cy=course-selection]')
      .click()
      .children()
      .contains('Ohjelmoinnin perusteet (TKT10002)')
      .click()

    cy.get('[data-cy=create-report-button]')
      .should('not.be.disabled')
      .click()

    cy.get('[data-cy=confirm-sending-button]')
      .should('be.visible')

    // Do not actually hit the button as it would go through importer etc.
    cy.get('[data-cy=cancel-sending-button]')
      .should('be.visible')
      .click()

    // Send the same completion to db instead
    cy.request('POST', '/api/seed/sis_completions', {
      testCompletions: [{ courseCode: "TKT10002", graderName: "grader" }],
      testRawEntries0to5: [{ studentNumber: "011111111", grade: 0 }],
      testRawEntriesHylHyv: [],
    })  

    cy.get('[data-cy=nav-reports]').click()
    cy.wait(2000)

    // Check that the entry of the batch is shown and no more entries are in the same list
    cy.get('[data-cy=sis-reports-tab]').click()
    cy.get('[data-cy=report-TKT10002]').first().click()
    cy.get('[data-cy=report-table] > tr')
      .eq(0)
      .should('contain', '011111111')
    cy.get('[data-cy=report-entry-grade]')
      .should('contain', 1)
  })

  it('When pasting (typing) completions with a non-existing employee number, no entries are created', () => {
    cy.login('admin').visit('')
    cy.get('[data-cy=adminmode-enable]').click()
    cy.get('[data-cy=copypaste]').should('be.visible').click()
    cy.get('[data-cy=paste-field]').type(
      '011111111;2;5;fi',
      {
        delay: 1,
      }
    )
    cy.get('#date-picker').clear().type('24.12.2020')
    cy.get('[data-cy=grader-selection]')
      .click()
      .children()
      .contains('grader')
      .click()

    cy.get('[data-cy=course-selection]')
      .click()
      .children()
      .contains('Tietorakenteet ja algoritmit I (TKT200011)')
      .click()

    cy.get('[data-cy=create-report-button]')
      .should('not.be.disabled')
      .click()

    cy.get('[data-cy=confirm-sending-button]')
      .should('be.visible')
      .click()

    cy.wait(20000)

    cy.get('[data-cy=nav-reports]').click()
    cy.get('[data-cy=sis-reports-tab]').click()

    // No new report has been created
    cy.get('[data-cy=report-table]').its('length').should('eq', 7)
  })
})