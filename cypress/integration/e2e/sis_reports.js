describe('SIS Reports -page shows data correctly', () => {
  before(function () {
    cy.request('/api/seed/all')
  })
  it('Entry data is shown correctly on the reports page', () => {
    cy.login('admin').visit('')
    cy.get('[data-cy=adminmode-enable]').click().wait(500)

    cy.get('[data-cy=nav-reports]').click()

    cy.get('[data-cy=sis-reports-tab]').click()
    cy.get('[data-cy=report-table]').its('length').should('eq', 7)

    cy.get('[data-cy=report-TKT10002').should('contain', 'Ohjelmoinnin perusteet').click()
    cy.get('[data-cy=entry-accordion]').should('contain', 'Ohjelmoinnin perusteet (TKT10002)')
    cy.get('[data-cy=entry-accordion]').click({ multiple: true, force: true }) // Open all entry accordions
    cy.get('[data-cy=report-course-content]').should('contain', 'entryPersonId')
    cy.get('[data-cy=report-student-number]').should('contain', '011111111')
    cy.get('[data-cy=report-completionDate]').should('contain', '09.08.2021')
    cy.get('[data-cy=report-completionLanguage]').should('contain', 'fi')
    cy.get('[data-cy=report-entry-grade]').should('contain', '1')

    cy.get('[data-cy=report-courseUnitRealisationName-1]').should('contain', 'courseUnitRealisationName-fi-1')

    cy.get('[data-cy=report-course-content]').should(
      'contain',
      'entryCourseUnitId',
      'entryCourseUnitRealisation',
      'Assessment ID 1',
      "Grader's ID 1",
      'sis-0-5'
    )
  })

  it('When not in admin-mode only own reports are visible', () => {
    cy.login('admin').visit('')

    cy.get('[data-cy=nav-reports]').click()

    cy.get('[data-cy=sis-reports-tab]').click()
    cy.get('[data-cy=report-table]').its('length').should('eq', 4)
    cy.get('[data-cy=report-TKT10002').should('contain', 'Ohjelmoinnin perusteet')

    cy.get('[data-cy=adminmode-enable]').click().wait(500)
    cy.get('[data-cy=report-table]').its('length').should('eq', 7)
  })

  it('Reports can be filtered by course', () => {
    cy.login('admin').visit('')
    cy.get('[data-cy=adminmode-enable]').click().wait(500)

    cy.get('[data-cy=nav-reports]').click()

    cy.get('[data-cy=sis-reports-tab]').click()

    cy.get('[data-cy=course-filter]').click().children().contains('Ohjelmoinnin perusteet (TKT10002)').click()

    cy.get('[data-cy=report-table]').its('length').should('eq', 1)

    cy.get('[data-cy=report-TKT10002').should('contain', 'Ohjelmoinnin perusteet').click()
    cy.get('[data-cy=entry-accordion]').should('contain', 'Ohjelmoinnin perusteet (TKT10002)')
  })

  it.only('Reports can be filtered by student number', () => {
    cy.login('admin').visit('')
    cy.get('[data-cy=adminmode-enable]').click().wait(500)

    cy.get('[data-cy=nav-reports]').click()

    cy.get('[data-cy=sis-reports-tab]').click()

    cy.get('[data-cy=student-filter]').type('011111112').wait(500)
    cy.contains('No reports found')

    cy.get('[data-cy=student-filter]').clear().type('011111111').wait(500)
    cy.get('[data-cy=report-table]').its('length').should('eq', 7)

    cy.get('[data-cy=report-TKT10002]').should('contain', 'Ohjelmoinnin perusteet').click()
    cy.get('[data-cy=report-table-row-011111111]').should('have.class', 'active')
  })
})

describe('BSc thesis reports are displayed correctly', () => {
  before(function () {
    cy.request('/api/seed/bsc_thesis')
  })

  it('Single entries can be deleted from the reports page', () => {
    cy.login('grader').visit('')
    cy.get('[data-cy=nav-reports]').click()

    cy.wait(1000)

    cy.get('[data-cy=sis-reports-tab]').click()
    cy.get('[data-cy=report-TKT20013]').click()
    cy.get('[data-cy=report-table]').children().should('have.length', 4)
    cy.get('[data-cy=entry-accordion]:contains("Erilliskirjaus")').its('length').should('eq', 3)
  })
})
