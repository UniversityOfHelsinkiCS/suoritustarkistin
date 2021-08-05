/// <reference types="Cypress" />

describe("Permissions", () => {
  before(() => {
    cy.request('DELETE', '/api/seed/users')
    cy.request('POST', '/api/seed/users', {
      name: 'admin',
      employeeId: Cypress.env('ADMIN_EMPLOYEE_NUMBER'),
      uid: 'admin',
      isAdmin: true,
      isGrader: false
    })
    cy.request('POST', '/api/seed/users', {
      name: 'grader',
      employeeId: Cypress.env('GRADER_EMPLOYEE_NUMBER'),
      uid: 'grader',
      isAdmin: false,
      isGrader: true
    })
    cy.request('POST', '/api/seed/users', {
      name: 'employee',
      employeeId: 222,
      uid: 'employee',
      isAdmin: false,
      isGrader: false
    })
    cy.request('POST', '/api/seed/users', {
      name: 'non-employee',
      employeeId: undefined,
      uid: 'non-employee',
      isAdmin: false,
      isGrader: false
    })

  })

  it("Users with employeeId and isGrader=false see who they should contact to get permissions", () => {
    cy.login('employee')
    cy.visit("/")
    cy.url().should("include","/unauthorized")

    cy.contains("New report").should("have.class","disabled")
    cy.contains("View reports").should("have.class","disabled")
    cy.contains("Your account has been created.")
    cy.contains("you must send an email")
    cy.logout()
  })

  it("Users without employeeId see 'Employees only' message", () => {
    cy.login('non-employee')
    cy.visit("/")
    cy.contains("This service is for employees only.")
    cy.contains("To use the service, you need to have an employee number.")
    cy.logout()
  })

  it("Admin users should be able to see the form tab", () => {
    cy.login('admin').visit('')
    cy.get('[data-cy=adminmode-enable]').click()
    cy.get('[data-cy=copypaste]')
    cy.logout()
  })

  it("Regular users should not see form tab and should not be able to post entries", () => {
    cy.login('employee').visit('')
    cy.wait(2000)
    cy.get('[data-cy=copypaste]').should('not.exist')

    cy.request({
      method: 'POST',
      url: 'api/sis_raw_entries',
      body: {
        data:[
          {
            studentId:"011000002",
            batchId:"",
            grade:"2",
            credits:"2",
            language:"en",
            graderId:"",
            reporterId:"",
            course:"",
            duplicate:false
          },{
            studentId:"010000003",
            batchId:"",
            grade:"3",
            credits:"3",
            language:"sv",
            graderId:"",
            reporterId:"",
            course:"",
            duplicate:false
          }
        ],
        courseId:2,
        date:"2020-12-30T09:00:00.900Z",
        graderId:Cypress.env('GRADER_EMPLOYEE_NUMBER'),
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(500)
    })
    cy.logout()
  })
})