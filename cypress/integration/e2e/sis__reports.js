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
    cy.get('[data-cy=sis-report-table]').its('length').should('eq', 1)

    cy.get('[data-cy=sis-report-course-code-1').should('contain', 'TKT10001')
    cy.get('[data-cy=sis-report-course-name-1').should('contain', 'Valid course 1')
    cy.get('[data-cy=sis-report-credits-1]').should('contain', '1,0')
    cy.get('[data-cy=sis-report-student-number-1]').should('contain', '011111111')
    cy.get('[data-cy="sis-report-personId-1').should('contain', "Student's ID 1")
    cy.get('[data-cy="sis-report-completionDate-1').should('contain', "30.12.2020")
    cy.get('[data-cy="sis-report-completionLanguage-1').should('contain', "fi")
    cy.get('[data-cy="sis-report-entry-grade-1').should('contain', "1")
    cy.get('[data-cy="sis-report-sent-1').should('contain', "Not sent yet")
    cy.get('[data-cy="sis-report-senderName-1').should('contain', "Not sent yet")

    cy.get('[data-cy=sis-report-entry-course-1').should('contain', 'Sis Valid course 1 - fi').click()

    cy.get('[data-cy="sis-report-course-content-1')
      .should('contain', "Course unit ID 1", "Course unit realisation ID 1", "Assessment ID 1", "Grader's ID 1", "sis-0-5")
  })

  it('Single entries can be deleted from the reports page', () => {
    cy.initializeUsersAndCourses()
    cy.asAdmin().visit('')
    // TODO: Structure the table better, so that everything (including delete-buttons) is shown also for smaller screens
    cy.viewport(1800, 1800)

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
    cy.get('[data-cy=sis-report-entry-delete-button-1]').should('be.visible').click()
    //cy.get('[data-cy=sis-report-entry-delete-button-2]').should('be.visible').click()
    //cy.get('[data-cy=sis-report-entry-delete-button-3]').should('be.visible').click()
    cy.get('[data-cy=sis-report-TKT10001]').should('not.exist');
  })
})