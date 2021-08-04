
describe('New entries can be added correctly', function () {

  it('When pasting (typing) completions with valid data, correct entries are created', () => {
    cy.initializeUsersAndCourses()
    cy.asAdmin().visit('')
    cy.get('[data-cy=adminmode-enable]').click()

    // Check that before entering any new entries, only one entry is shown
    // Mock the importer calls
    cy.server()
    cy.route('GET', 'http://localhost:8001/api/sis_reports', '@initialRawEntriesJSON').as('getInitialEntries')
    cy.route('POST', 'http://localhost:8001/api/sis_raw_entries', '@addRawEntriesJSON').as('addRawEntries')

    cy.get('[data-cy=nav-reports]').click()
    cy.wait('@getInitialEntries')

    cy.get('[data-cy=sis-reports-tab]').click()
    cy.get('[data-cy=report-TKT10001]').click()
    cy.get('[data-cy=report-student-number-1]').should('contain', '011111111')

    // Emulate sending two new entries in the same batch
    cy.get('[data-cy=nav-new-report]').click()
    cy.get('[data-cy=copypaste]').should('be.visible').click()
    cy.get('[data-cy=create-report-button]').should('be.disabled')
    cy.get('[data-cy=paste-field]').type(
      '011000002;2;2;en\n010000003;3;3;sv',
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
      .contains('Valid course 2 (TKT10002)')
      .click()

    cy.get('[data-cy=create-report-button]')
      .should('not.be.disabled')
      .click()

    cy.get('[data-cy=confirm-sending-button]')
      .should('be.visible')
      .click()

    cy.get('[data-cy=create-report-button]')
      .should('be.disabled')

    cy.server()
    cy.route('GET', 'http://localhost:8001/api/sis_reports', '@updatedRawEntriesJSON').as('getUpdatedEntries')

    cy.get('[data-cy=nav-reports]').click()
    cy.wait('@getUpdatedEntries')
    cy.wait(2000)

    // Check that both entries of the same batch are shown and no more entries in the same list
    cy.get('[data-cy=sis-reports-tab]').click()
    cy.get('[data-cy=report-TKT10002]').click()
    cy.get('[data-cy=report-table]').its('length').should('eq', 2)
    cy.get('[data-cy=report-student-number-2]').should('contain', '011000002')
    cy.get('[data-cy=report-student-number-3]').should('contain', '010000003')
  })

  it('When pasting (typing) completions with a non-existing employee number, no entries are created', () => {
    cy.initializeUsersAndCourses()
    cy.asAdmin().visit('')
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
      .contains('Valid course 1 (TKT10001)')
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
    cy.get('[data-cy=no-reports]')
  })
})