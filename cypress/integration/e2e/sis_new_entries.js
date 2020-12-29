describe('New sis-entries can be added correctly', function () {
  beforeEach(function () {
    cy.server({
      onAnyRequest: (route, proxy) => {
        proxy.xhr.setRequestHeader('employeenumber', Cypress.env('ADMIN_EMPLOYEE_NUMBER'))
      },
    })
    cy.request('DELETE', '/api/courses')
    cy.request('DELETE', '/api/users')
    cy.request('DELETE', '/api/sis_reports')

    cy.fixture('sis/raw-entries-before.json').as('initialRawEntriesJSON');
    cy.fixture('sis/raw-entries-add.json').as('addRawEntriesJSON');
    cy.fixture('sis/raw-entries-after.json').as('updatedRawEntriesJSON');

    cy.request('POST', '/api/users', {
      name: 'sis_test_teacher',
      employeeId: '123',
      isAdmin: false,
      isGrader: false,
    })

    cy.request('POST', '/api/users', {
      name: 'sis_test_grader',
      employeeId: '321',
      isAdmin: false,
      isGrader: true,
    })
    .then((response) => {
      cy.request('POST', '/api/courses', {
        id: 1,
        name: 'Valid course',
        courseCode: 'TKT10001',
        language: 'fi',
        credits: '3,0',
        graderId: response.body.id,
      })

    cy.request('POST', '/api/users', {
      name: 'sis_test_admin',
      employeeId: Cypress.env('ADMIN_EMPLOYEE_NUMBER'),
      isAdmin: true,
      isGrader: false,
    })
    .then((response) => {
      cy.request('POST', '/api/courses', {
        id: 2,
        name: 'Valid course',
        courseCode: 'TKT20001',
        language: 'fi',
        credits: '3,0',
        graderId: response.body.id,
      })
      cy.request('POST', '/api/courses', {
        id: 3,
        name: 'Another valid course',
        courseCode: 'TKT20002',
        language: 'en',
        credits: '8,0',
        graderId: response.body.id,
      })
    })
  })
})

  it('When pasting (typing) completions with fake employee number, error message is shown and no entries are created', () => {
    cy.visit('')
    cy.get('[data-cy=adminmode-enable]').click()
    cy.get('[data-cy=sisCopypaste]').should('be.visible').click()
    cy.get('[data-cy=sisSendButton]').should('be.disabled')
    cy.get('[data-cy=sisPastefield]').type(
      '011111111;2;5;fi',
      {
        delay: 1,
      }
    )
    cy.get('#sisDatePicker').clear().type('24.12.2020')
    cy.get('[data-cy=sisGraderSelection]')
      .click()
      .children()
      .contains('sis_test_grader')
      .click()

    cy.get('[data-cy=sisCourseSelection]')
      .click()
      .children()
      .contains('Valid course (TKT10001)')
      .click()

    cy.get('[data-cy=sisSendButton]')
      .should('not.be.disabled')
      .click()
      .should('be.disabled')

    cy.wait(20000)

    cy.get('[data-cy=negative-message]')
    cy.get('[data-cy=nav-reports]').click()
    cy.get('[data-cy=sis-reports-tab]').click()
    cy.get('[data-cy=sis-no-reports]')
  })
})