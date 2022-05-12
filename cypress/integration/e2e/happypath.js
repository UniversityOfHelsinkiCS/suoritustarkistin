describe('Basic functions work', function () {
  before(function () {
    cy.request('/api/seed/all')
  })

  it('Admin can grant rights', () => {
    cy.login('admin').visit('')
    cy.get('[data-cy=adminmode-enable]').click().wait(500)
    cy.get('[data-cy=nav-users]').click()
    cy.get('[data-cy=regular-not-admin]').click()
    cy.get('[data-cy=grant-admin-confirm]').click()
    cy.get('[data-cy=regular-is-admin]').click()
    cy.get('[data-cy=remove-admin-confirm]').click()
    cy.get('[data-cy=regular-not-admin]')

    cy.get('[data-cy=regular-not-grader]').click()
    cy.get('[data-cy=grant-grader-confirm]').click()
    cy.get('[data-cy=regular-is-grader]')
  })

  it('Admin can create and edit course', () => {
    cy.login('admin').visit('')
    cy.get('[data-cy=adminmode-enable]').click().wait(500)
    cy.get('[data-cy=nav-courses]').click()
    cy.get('[data-cy=add-course-button]').click()
    cy.get('[data-cy=add-course-name] input').type('E2E Testaus')
    cy.get('[data-cy=add-course-code] input').type('TKT20042')
    cy.get('[data-cy=add-course-language] input').type('fi')
    cy.get('[data-cy=add-course-credits] input').type('1,0')
    cy.get('[data-cy=add-course-grader]').click().children().contains('grader').click()
    cy.get('[data-cy=add-course-confirm]').click()

    cy.get('[data-cy=TKT20042-edit-button]').click()
    cy.get('[data-cy=edit-course-credits] input').clear().type('1,5')
    cy.get('[data-cy=edit-course-confirm]').click()
    cy.logout()
  })

  it('Grader can create reports', () => {
    cy.login('grader').visit('')

    cy.get('[data-cy=confirm-sending-button]').should('be.disabled')
    cy.get('[data-cy=paste-field]').type('010000003;2;5;fi\n011000002;3;2,0\n011100009;4\n011110002;5;;fi')
    cy.get('#date-picker').clear().type('30.12.2020')

    cy.get('[data-cy=grader-selection]').click().children().should('not.contain', 'admin').contains('grader').click()

    cy.get('[data-cy=course-selection]').click().children().contains('E2E').click()

    cy.get('[data-cy=confirm-sending-button]').should('not.be.disabled').click()

    cy.get('[data-cy=confirm-sending-button]').should('be.visible')
    cy.logout()
  })

  it('Grader can view all reports where they are as graders', () => {
    cy.login('grader').visit('')
    cy.get('[data-cy=nav-reports]').click()
    cy.get('[data-cy=sis-reports-tab]').click()
    cy.get('[data-cy=report-TKT200012]').should('be.visible')
    cy.get('[data-cy=report-TKT10005]').should('be.visible')
    cy.get('[data-cy=report-TKT10003]').should('be.visible')
    cy.logout()
  })
})
