// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add(
  'upload',
  {
    prevSubject: 'element'
  },
  (subject, content, fileName) => {
    cy.window().then((window) => {
      const testFile = new window.File([content], fileName)
      cy.wrap(subject).trigger('drop', {
        dataTransfer: { files: [testFile], types: ['Files'] }
      })
    })
  }
)

Cypress.Commands.add('asAdmin', () => {
  cy.server({
    onAnyRequest: (route, proxy) => {
      proxy.xhr.setRequestHeader('employeenumber', Cypress.env('ADMIN_EMPLOYEE_NUMBER'))
    }
  })
})

Cypress.Commands.add('asUser', () => {
  cy.server({
    onAnyRequest: (route, proxy) => {
      proxy.xhr.setRequestHeader('employeenumber', Cypress.env('USER_EMPLOYEE_NUMBER'))
    }
  })
})

Cypress.Commands.add('asGrader', () => {
  cy.server({
    onAnyRequest: (route, proxy) => {
      proxy.xhr.setRequestHeader('employeenumber', Cypress.env('GRADER_EMPLOYEE_NUMBER'))
    }
  })
})


Cypress.Commands.add('initializeUsersAndCourses', () => {

  cy.request('DELETE', '/api/seed/courses')
  cy.request('DELETE', '/api/seed/users')

  cy.fixture('sis/raw-entries-before.json').as('initialRawEntriesJSON');
  cy.fixture('sis/raw-entries-add.json').as('addRawEntriesJSON');
  cy.fixture('sis/raw-entries-after.json').as('updatedRawEntriesJSON');

  cy.request('POST', '/api/seed/users', {
    name: 'user',
    uid: 'user-321',
    employeeId: 321,
    isAdmin: false,
    isGrader: false,
  })

  cy.request('POST', '/api/seed/users', {
    name: 'grader',
    employeeId: 111,
    uid: 'grader-1',
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
      graders: [response.body.id],
    })
    cy.request('POST', '/api/courses', {
      id: 2,
      name: 'Valid course 2',
      courseCode: 'TKT10002',
      language: 'en',
      credits: '8,0',
      graders: [response.body.id],
    })
    cy.request('POST', '/api/courses', {
      id: 3,
      name: 'Valid course 3',
      courseCode: 'TKT10003',
      language: 'sv',
      credits: '5,0',
      graders: [response.body.id],
    })

  cy.request('POST', '/api/seed/users', {
    name: 'admin',
    employeeId: 123,
    uid: 'admin-123',
    isAdmin: true,
    isGrader: false,
  })
  .then((response) => {
    cy.request('POST', '/api/courses', {
      id: 4,
      name: 'Valid AY-course',
      courseCode: 'AYTKT10004',
      language: 'fi',
      credits: '4,0',
      graders: [response.body.id],
    })
    cy.request('POST', '/api/courses', {
      id: 5,
      name: 'Valid CSM-course',
      courseCode: 'CSM12106',
      language: 'en',
      credits: '5,0',
      graders: [response.body.id],
    })
    cy.request('POST', '/api/courses', {
      id: 6,
      name: 'Valid DATA-course',
      courseCode: 'DATA12001',
      language: 'en',
      credits: '5,0',
      graders: [response.body.id],
    })
    })
  })
})
