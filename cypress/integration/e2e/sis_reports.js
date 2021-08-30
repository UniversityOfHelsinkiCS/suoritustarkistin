
describe('SIS Reports -page shows data correctly', () => {
  before(function () {
    cy.request('/api/seed/all')
  })

  it('Entry data is shown correctly on the reports page', () => {
    cy.login('admin').visit('')
    cy.get('[data-cy=adminmode-enable]').click()

    cy.get('[data-cy=nav-reports]').click()

    cy.get('[data-cy=sis-reports-tab]').click()
    cy.get('[data-cy=report-table]').its('length').should('eq', 7)

    cy.get('[data-cy=report-TKT10002').should('contain', 'Ohjelmoinnin perusteet').click()
    cy.get('[data-cy=report-course-code]').should('contain', 'TKT10002')
    cy.get('[data-cy=report-student-number]').should('contain', '011111111')
    cy.get('[data-cy=report-personId]').should('contain', "entryPersonId")
    cy.get('[data-cy=report-completionDate]').should('contain', "09.08.2021")
    cy.get('[data-cy=report-completionLanguage]').should('contain', "fi")
    cy.get('[data-cy=report-entry-grade]').should('contain', "1")
    cy.get('[data-cy=report-sent]').should('be.empty')
    cy.get('[data-cy=report-senderName]').should('be.empty')

    cy.get('[data-cy=report-courseUnitRealisationName-1]').should('contain', 'courseUnitRealisationName-fi-1')

    cy.get('[data-cy=report-course-content]')
      .should('contain', "entryCourseUnitId", "entryCourseUnitRealisation", "Assessment ID 1", "Grader's ID 1", "sis-0-5")
    cy.logout()
  })

  it('Single entries can be deleted from the reports page', () => {
    cy.login('admin').visit('')
    // TODO: Structure the table better, so that everything (including delete-buttons) is shown also for smaller screens
    cy.viewport(1800, 1800)

    cy.get('[data-cy=adminmode-enable]').click()
    cy.get('[data-cy=nav-reports]').click()
    cy.wait(1000)

    cy.get('[data-cy=sis-reports-tab]').click()
    cy.get('[data-cy=report-TKT200012]').click()
    cy.get('.content.active > .basic > .table > [data-cy=report-table] > :nth-child(4) > :nth-child(14)').click()
    cy.get('[data-cy=report-delete-entry-confirm]').click()
    cy.get('.content.active > .basic > [data-cy=report-delete-batch-button]').should('contain', 'Delete completions').click()
    cy.get('[data-cy=report-delete-batch-confirm]').click()
    cy.get('[data-cy=report-TKT200012]').should('not.exist');
    cy.logout()
  })
})