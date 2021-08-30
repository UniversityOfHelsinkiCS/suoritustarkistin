describe('Creating and assigning courses work', function () {

  before(function () {
    cy.request('/api/seed/all')
  })

  it('Admin cannot create invalid course', () => {
    cy.login('admin').visit('')
    cy.get('[data-cy=adminmode-enable]').click()
    cy.get('[data-cy=nav-courses]').click()
    cy.get('[data-cy=add-course-button]').click()
    cy.get('[data-cy=add-course-name] input').type('Testi kurssi')
    cy.get('[data-cy=add-course-code] input').type('TKT20042')
    cy.get('[data-cy=add-course-language] input').type('fi')
    cy.get('[data-cy=add-course-credits] input').type('1,0')
    cy.get('[data-cy=add-course-confirm]').should('not.be.disabled')

    // Missing course name
    cy.get('[data-cy=add-course-name]').clear()
    cy.get('[data-cy=add-course-confirm]').should('be.disabled')

    cy.get('[data-cy=add-course-name] input').type('Testi kurssi')
    cy.get('[data-cy=add-course-confirm]').should('not.be.disabled')
    cy.get('[data-cy=add-course-code]').clear()
    cy.get('[data-cy=add-course-confirm]').should('be.disabled')

    // Course code with typos
    cy.get('[data-cy=add-course-code] input').type('AATT2322')
    cy.get('[data-cy=add-course-confirm]').should('be.disabled')

    // Missing course code
    cy.get('[data-cy=add-course-code]').clear()
    cy.get('[data-cy=add-course-confirm]').should('be.disabled')

    // Invalid language
    cy.get('[data-cy=add-course-code] input').type('AYTKT12345')
    cy.get('[data-cy=add-course-confirm]').should('not.be.disabled')
    cy.get('[data-cy=add-course-language] input').type('se')
    cy.get('[data-cy=add-course-confirm]').should('be.disabled')

    // Missing language
    cy.get('[data-cy=add-course-language] input').clear()
    cy.get('[data-cy=add-course-confirm]').should('be.disabled')

    // Missing credits
    cy.get('[data-cy=add-course-language] input').type("fi")
    cy.get('[data-cy=add-course-confirm]').should('not.be.disabled')
    cy.get('[data-cy=add-course-credits] input').clear()
    cy.get('[data-cy=add-course-confirm]').should('be.disabled')

    // Graders and grade scales can be added but are not required
    cy.get('[data-cy=add-course-grader]')
      .click()
      .children()
      .contains('grader')
      .click()

    cy.get('[data-cy=add-course-grade-scale]')
      .click()
    cy.get('span').contains('sis-0-5').click()



    cy.logout()
  })

})
