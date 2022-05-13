/// <reference types="Cypress" />

describe('User management', () => {
  before(function () {
    cy.request('/api/seed/all')
  })

  it('Admins can add new graders and their are shown as graders', () => {
    cy.login('admin').visit('')
    cy.get('[data-cy=adminmode-enable]').click().wait(500)
    cy.get('[data-cy=nav-users]').click()

    cy.get('[data-cy=add-user-button]').click()
    cy.get('[data-cy=add-email]').type('second-grader@test.com')
    cy.get('[data-cy=add-user-id]').type('secondGrader')
    cy.get('[data-cy=add-employee-number]').type('4444')
    cy.get('[data-cy=add-user-name]').type('secondGrader')
    cy.get('[data-cy=check-is-grader]').click()
    cy.get('[data-cy=add-user-confirm]').click()

    cy.visit('/')
    cy.get('[data-cy=grader-selection]').click()
    cy.get('span').contains('grader')
    cy.get('span').contains('secondGrader')
    cy.get('span').contains('admin').should('not.exist')
    cy.get('span').contains('regular').should('not.exist')
    cy.logout()
  })

  it('Admin can edit users', () => {
    cy.login('admin').visit('')
    cy.get('[data-cy=adminmode-enable]').click().wait(500)
    cy.get('[data-cy=nav-users]').click()

    cy.get('[data-cy=regular-not-admin]').click()
    cy.get('[data-cy=grant-admin-confirm]').click()

    cy.get('[data-cy=regular-is-admin]').should('exist')

    cy.get('[data-cy=regular-edit]').click()
    cy.get('[data-cy=add-user-id]').type('edited')

    cy.get('[data-cy=add-user-confirm]').click()

    cy.contains('regularedited')
  })

  it('Admin can delete users', () => {
    cy.login('admin').visit('')
    cy.get('[data-cy=adminmode-enable]').click().wait(500)
    cy.get('[data-cy=nav-users]').click()

    cy.get('[data-cy=regular-delete]').click()
    cy.get('[data-cy=delete-user-confirm]').click()

    cy.get('[data-cy=regular-delete').should('not.exist')
  })

  it('User can be created', () => {
    cy.login('admin').visit('')
    cy.get('[data-cy=adminmode-enable]').click().wait(500)
    cy.get('[data-cy=nav-users]').click()

    cy.get('[data-cy=add-user-button]').click()
    cy.get('[data-cy=add-email]').type("test-user@test.com")
    cy.get('[data-cy=add-user-id]').type("testUser")
    cy.get('[data-cy=add-employee-number]').type("1111")
    cy.get('[data-cy=add-user-name]').type("testUser")
    cy.get('[data-cy=add-user-confirm]').click()

    cy.get('[data-cy=user-grid]').should('contain', 'testUser')
  })
})
