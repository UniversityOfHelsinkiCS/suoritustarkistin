describe('Submitting data creates a valid report into database', function() {
  before(function() {
    cy.request('DELETE', '/api/seed/courses')
    cy.request('DELETE', '/api/seed/users')
    cy.request('DELETE', '/api/seed/reports')

    cy.request('POST', '/api/seed/users', {
      name: 'admin',
      employeeId: Cypress.env('ADMIN_EMPLOYEE_NUMBER'),
      isAdmin: true,
      isGrader: false
    })
    cy.request('POST', '/api/seed/users', {
      name: 'user',
      employeeId: Cypress.env('USER_EMPLOYEE_NUMBER'),
      isAdmin: false,
      isGrader: false
    })
  })

  it('Admin can grant rights', () => {
    cy.asAdmin().visit('')
    cy.get('[data-cy=adminmode-enable]').click()
    cy.get('[data-cy=nav-users]').click()
    cy.get('[data-cy=user-not-admin]').click()
    cy.get('[data-cy=grant-admin-confirm]').click()
    cy.get('[data-cy=user-is-admin]').click()
    cy.get('[data-cy=remove-admin-confirm]').click()
    cy.get('[data-cy=user-not-admin]')

    cy.get('[data-cy=user-not-grader]').click()
    cy.get('[data-cy=grant-grader-confirm]').click()
    cy.get('[data-cy=user-is-grader]')
  })

  it('Admin can create and edit course', () => {
    cy.asAdmin().visit('')

    cy.get('[data-cy=adminmode-enable]').click()
    cy.get('[data-cy=nav-courses]').click()
    cy.get('[data-cy=add-course-button]').click()
    cy.get('[data-cy=add-course-name] input').type('E2E Testaus')
    cy.get('[data-cy=add-course-code] input').type('TKT20042')
    cy.get('[data-cy=add-course-language] input').type('fi')
    cy.get('[data-cy=add-course-credits] input').type('1,0')
    cy.get('[data-cy=add-course-grader]')
      .click()
      .children()
      .contains('user')
      .click()
    cy.get('[data-cy=add-course-confirm]').click()

    cy.get('[data-cy=TKT20042-edit-button]').click()
    cy.get('[data-cy=edit-course-credits] input')
      .clear()
      .type('1,5')
    cy.get('[data-cy=edit-course-confirm]').click()
  })

  it('Grader can create reports', () => {
    cy.asUser().visit('')
    cy.get('[data-cy=create-report-button]').should('be.disabled')
    cy.get('[data-cy=pastefield]').type(
      '010000003;2;5;fi\n011000002;;2,0\n011100009\n011110002;;;fi'
    )
    cy.get('[data-cy=dateField] input')
      .clear()
      .type('5.7.2019')

    cy.get('[data-cy=courseSelection]')
      .click()
      .children()
      .contains('E2E')
      .click()

    cy.get('[data-cy=create-report-button]')
      .should('not.be.disabled')
      .click()

    cy.get('[data-cy=confirm-sending-button]')
      .should('be.visible')
      .click()

    cy.get('[data-cy=create-report-button]')
      .should('be.disabled')
  })



  it('Grader can view created report', () => {
    cy.asUser().visit('')
    cy.get('[data-cy=nav-reports]').click()
    cy.get('[data-cy=raw-reports-tab]').click()
    cy.get('[data-cy=report-not-downloaded]')
    cy.get('[data-cy=raw-reports]').contains(
      '011100009##1#TKT20042#E2E Testaus#5.7.2019#0#Hyv.#106##321#2#H523#####1,5'
    )
  })
})
