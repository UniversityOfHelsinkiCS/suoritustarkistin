/// <reference types="cypress" />

import { logout, setHeaders } from "../../client/utils/mockHeaders"

/**
 * Logs in as specified user.
 * @param {string} uid Uid of user to login as
 */
Cypress.Commands.add('login', (uid) => {
  setHeaders(uid)
  cy.log(`Logged in as ${uid}`)
})

Cypress.Commands.add('logout', () => {
  logout()
  cy.log(`Logged user out`)
})

Cypress.Commands.add('initializeUsersAndCourses', () => {

  cy.request('DELETE', '/api/seed/courses')
  cy.request('DELETE', '/api/seed/users')

  cy.fixture('raw-entries-before.json').as('initialRawEntriesJSON')
  cy.fixture('raw-entries-add.json').as('addRawEntriesJSON')
  cy.fixture('raw-entries-after.json').as('updatedRawEntriesJSON')

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
