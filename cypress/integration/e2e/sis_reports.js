describe('SIS Reports -page shows data correctly', function () {
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
        credits: '1,0',
        graderId: response.body.id,
      })

    cy.request('POST', '/api/users', {
      name: 'sis_test_admin',
      employeeId: Cypress.env('ADMIN_EMPLOYEE_NUMBER'),
      isAdmin: true,
      isGrader: true,
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

  it('Entries are shown correctly on the reports page', () => {
    cy.visit('')
    cy.get('[data-cy=adminmode-enable]').click()

    cy.server()
    cy.route('GET', 'http://localhost:8000/api/sis_reports', '@initialRawEntriesJSON').as('getInitialEntries')

    cy.get('[data-cy=nav-reports]').click()
    cy.wait('@getInitialEntries')
    cy.wait(2000)

    cy.get('[data-cy=sis-reports-tab]').click()
    cy.get('[data-cy=sis-report-TKT10001]').click()
    cy.get('[data-cy=sis-report-grade-1]').should('contain', 'valid grade 1')

    cy.get('[data-cy=sis-report-table]').its('length').should('eq', 1)

    cy.get('[data-cy=sis-report-course-code-1').should('contain', 'TKT10001')
    cy.get('[data-cy=sis-report-course-name-1').should('contain', 'Valid course 1')
    cy.get('[data-cy=sis-report-grade-1]').should('contain', 'valid grade 1')
    cy.get('[data-cy=sis-report-student-number-1]').should('contain', '011111111')
    cy.get('[data-cy="sis-report-personId-1').should('contain', "Student's ID 1")
    cy.get('[data-cy="sis-report-verifierPersonId-1').should('contain', "Grader's ID 1")
    cy.get('[data-cy="sis-report-courseUnitRealisationId-1').should('contain', "Course unit realisation ID 1")
    cy.get('[data-cy="sis-report-assessmentItemId-1').should('contain', "Assessment ID 1")
    cy.get('[data-cy="sis-report-completionDate-1').should('contain', "2020-12-30T08:00:00.900Z")
    cy.get('[data-cy="sis-report-completionLanguage-1').should('contain', "fi")
  })

})