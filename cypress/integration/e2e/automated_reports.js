describe('Automated reports', () => {
  before(function () {
    cy.request('/api/seed/all')
  })

  it('Admin can add a new job', () => {
    cy.login('admin').visit('')
    cy.get('[data-cy=adminmode-enable]').click().wait(500)

    cy.get('[data-cy=nav-automated-reports]').click()
    cy.get('[data-cy=mooc-jobs-tab]').click()

    cy.get('[data-cy=add-job-button]').click()

    cy.get('[data-cy=add-job-schedule').type('0 0 * * *')
    cy.get('[data-cy=add-job-course').click().children().contains('Ohjelmoinnin perusteet (TKT10002)').click()
    cy.get('[data-cy=add-job-grader]').click().children().contains('grader').click()
    cy.get('[data-cy=add-job-active]').click()

    cy.get('[data-cy=add-job-confirm]').click().wait(500)

    cy.get('[data-cy=mooc-job-table]')
      .should('contain', '0 0 * * *')
      .should('contain', 'Ohjelmoinnin perusteet')
      .should('contain', 'grader')
  })
})
