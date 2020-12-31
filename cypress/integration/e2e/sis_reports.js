describe('SIS Reports -page shows data correctly', () => {
  it('Entry data is shown correctly on the reports page', () => {
    cy.initializeUsersAndCourses()
    cy.asAdmin().visit('')
    cy.get('[data-cy=adminmode-enable]').click()

    cy.server()
    cy.route('GET', 'http://localhost:8000/api/sis_reports', '@initialRawEntriesJSON').as('getInitialEntries')

    cy.get('[data-cy=nav-reports]').click()
    cy.wait('@getInitialEntries')
    cy.wait(1000)

    cy.get('[data-cy=sis-reports-tab]').click()
    cy.get('[data-cy=sis-report-TKT10001]').click()
    cy.get('[data-cy=sis-entries-panel-TKT10001]').click()

    cy.get('[data-cy=sis-report-grade-1]').should('contain', 'valid grade 1')

    cy.get('[data-cy=sis-report-table]').its('length').should('eq', 1)

    cy.get('[data-cy=sis-report-course-code-1').should('contain', 'TKT10001')
    cy.get('[data-cy=sis-report-course-name-1').should('contain', 'Valid course 1')
    cy.get('[data-cy=sis-report-grade-1]').should('contain', 'valid grade 1')
    cy.get('[data-cy=sis-report-student-number-1]').should('contain', '011111111')
    cy.get('[data-cy="sis-report-personId-1').should('contain', "Student's ID 1")
    cy.get('[data-cy="sis-report-verifierPersonId-1').should('contain', "Grader's ID 1")
    cy.get('[data-cy="sis-report-courseUnitRealisationId-1').should('contain', "Course unit realisation ID 1")
    cy.get('[data-cy="sis-report-assessmentItemId-1').should('contain', "Assessment ID 1")
    cy.get('[data-cy="sis-report-completionDate-1').should('contain', "2020-12-30T08:00:00.900Z")
    cy.get('[data-cy="sis-report-completionLanguage-1').should('contain', "fi")
  })

  it('Single entries can be deleted from the reports page', () => {
    cy.initializeUsersAndCourses()
    cy.asAdmin().visit('')
    cy.get('[data-cy=adminmode-enable]').click()
    cy.server()
    cy.route('GET', 'http://localhost:8000/api/sis_reports', '@updatedRawEntriesJSON').as('getUpdatedEntries')
    cy.wait(1000)
    cy.get('[data-cy=nav-reports]').click()
    cy.get('[data-cy=nav-reports]').click()
    cy.wait('@getUpdatedEntries')
    cy.wait(1000)

    cy.get('[data-cy=sis-reports-tab]').click()
    cy.get('[data-cy=sis-report-TKT10001]').click()
    cy.get('[data-cy=sis-entries-panel-TKT10001]').click()
    cy.get('[data-cy=sis-report-entry-delete-button-1]').should('be.visible').click()

    cy.get('[data-cy=sis-report-TKT10002]').click()
    cy.get('[data-cy=sis-entries-panel-TKT10002]').click()
    cy.get('[data-cy=sis-report-entry-delete-button-2]').should('be.visible').click()

    cy.get('[data-cy=sis-report-TKT10002]').click()
    cy.get('[data-cy=sis-entries-panel-TKT10002]').click()
    cy.get('[data-cy=sis-report-entry-delete-button-3]').should('be.visible').click()

    cy.get('[data-cy=sis-no-reports]')
  })
})