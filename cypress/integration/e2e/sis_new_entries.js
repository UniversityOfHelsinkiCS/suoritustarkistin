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
        name: 'Valid course 1',
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
        name: 'Valid course 2',
        courseCode: 'TKT10002',
        language: 'en',
        credits: '2,0',
        graderId: response.body.id,
      })
      cy.request('POST', '/api/courses', {
        id: 3,
        name: 'Valid course 3',
        courseCode: 'TKT10003',
        language: 'sv',
        credits: '3,0',
        graderId: response.body.id,
      })
    })
  })
})
  it('When pasting (typing) completions with valid data, correct entries are created', () => {
    cy.visit('')
    cy.get('[data-cy=adminmode-enable]').click()

    // Check that before entering any new entries, only one entry is shown 
    // Mock the importer calls
    cy.server()
    cy.route('GET', 'http://localhost:8000/api/sis_reports', '@initialRawEntriesJSON').as('getInitialEntries')
    cy.route('POST', 'http://localhost:8000/api/sis_raw_entries', '@addRawEntriesJSON').as('addRawEntries')

    cy.get('[data-cy=nav-reports]').click()
    cy.wait('@getInitialEntries')

    cy.get('[data-cy=sis-reports-tab]').click()
    cy.get('[data-cy=sis-report-TKT10001]').click()
    cy.get('[data-cy=sis-report-course-code-1]').should('contain', 'TKT10001')
    cy.get('[data-cy=sis-report-student-number-1]').should('contain', '011111111')

    // Emulate sending two new entries in the same batch
    cy.get('[data-cy=nav-new-report]').click()
    cy.get('[data-cy=sisCopypaste]').should('be.visible').click()
    cy.get('[data-cy=sisSendButton]').should('be.disabled')
    cy.get('[data-cy=sisPastefield]').type(
      '011000002;2;2;en\n010000003;3;3;sv',
      {
        delay: 1,
      }
    )
    cy.get('#sisDatePicker').clear().type('30.12.2020')
    cy.get('[data-cy=sisGraderSelection]')
      .click()
      .children()
      .contains('sis_test_grader')
      .click()

    cy.get('[data-cy=sisCourseSelection]')
      .click()
      .children()
      .contains('Valid course 2 (TKT10002)')
      .click()

    cy.get('[data-cy=sisSendButton]')
      .should('not.be.disabled')
      .click()
      .should('be.disabled')

    cy.server()
    cy.route('GET', 'http://localhost:8000/api/sis_reports', '@updatedRawEntriesJSON').as('getUpdatedEntries')  

    cy.get('[data-cy=nav-reports]').click()
    cy.wait('@getUpdatedEntries')
    cy.wait(2000)

    // Check that both entries of the same batch are shown and no more entries in the same list
    cy.get('[data-cy=sis-reports-tab]').click()
    cy.get('[data-cy=sis-report-table]').its('length').should('eq', 2)
    cy.get('[data-cy=sis-report-TKT10002]').click()
    cy.get('[data-cy=sis-report-course-code-2]').should('contain', 'TKT10002')
    cy.get('[data-cy=sis-report-student-number-2]').should('contain', '011000002')
    cy.get('[data-cy=sis-report-course-code-3]').should('contain', 'TKT10002')
    cy.get('[data-cy=sis-report-student-number-3]').should('contain', '010000003')

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
      .contains('Valid course 1 (TKT10001)')
      .click()

    cy.get('[data-cy=sisSendButton]')
      .should('not.be.disabled')
      .click()
      .should('be.disabled')

    cy.wait(25000)

    cy.get('[data-cy=negative-message]')
    cy.get('[data-cy=nav-reports]').click()
    cy.get('[data-cy=sis-reports-tab]').click()
    cy.get('[data-cy=sis-no-reports]')
  })
})