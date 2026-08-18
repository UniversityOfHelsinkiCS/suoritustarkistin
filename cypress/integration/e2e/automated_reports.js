describe('Automated reports', () => {
  before(function () {
    cy.request('/api/seed/all')
  })

  it('Admin can create, edit and delete a job', () => {
    cy.login('admin').visit('')
    cy.get('[data-cy=adminmode-enable]').click().wait(500)

    cy.get('[data-cy=nav-automated-reports]').click()
    cy.get('[data-cy=add-job-button]').click()

    cy.get('[data-cy=add-job-schedule]').type('0 0 * * *')
    cy.get('[data-cy=add-job-course] input').click()
    cy.get('[role=listbox]').contains('Ohjelmoinnin perusteet (TKT10002)').click()
    cy.get('[data-cy=add-job-grader] input').click()
    cy.get('[role=listbox]').contains('grader').click()
    cy.get('[data-cy=add-job-active]').click()

    cy.get('[data-cy=add-job-confirm]').click().wait(500)

    cy.get('[data-cy=job-TKT10002]')
      .should('contain', '0 0 * * *')
      .should('contain', 'Ohjelmoinnin perusteet')
      .should('contain', 'grader')

    cy.get('[data-cy=edit-job]').click()
    cy.get('[data-cy=edit-job-schedule] input').clear().type('0 0 1 1 1')
    cy.get('[data-cy=edit-job-active]').click()

    cy.get('[data-cy=edit-job-confirm]').click()

    cy.get('[data-cy=job-TKT10002]')
      .should('contain', '0 0 1 1 1')
      .should('contain', 'Ohjelmoinnin perusteet')
      .should('contain', 'grader')

    cy.get('[data-cy=delete-job-TKT10002]').click()
    cy.get('[data-cy=delete-job-confirm]').click()

    cy.get('[data-cy=job-TKT10002]').should('not.exist')
  })
})
