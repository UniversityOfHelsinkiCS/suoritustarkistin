/// <reference types="Cypress" />

describe("Permissions", () => {
  before(function () {
    cy.request('/api/seed/all')
  })

  it("Users with employeeId and isGrader=false see who they should contact to get permissions", () => {
    cy.login('regular')
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

  it("Admin users should be able to see the form tab and admin-tabs", () => {
    cy.login('admin').visit('')
    cy.get('[data-cy=adminmode-enable]').click().wait(500)
    cy.get('[data-cy=copypaste]')
    cy.get('a').contains('Edit users')
    cy.get('a').contains('Automated')
    cy.get('a').contains('Sandbox')
    cy.logout()
  })

  it("Grader users should not be able to see admin-tabs", () => {
    cy.login('grader').visit('')
    cy.get('[data-cy=adminmode-enable]').should('not.exist')
    cy.get('a').contains('Edit users').should('not.exist')
    cy.get('a').contains('Automated').should('not.exist')
    cy.get('a').contains('Sandbox').should('not.exist')
    cy.logout()
  })

  it("Grader users should be able to see the form tab", () => {
    cy.login('grader').visit('')
    cy.get('[data-cy=copypaste]')
    cy.logout()
  })

  it("Grader can see themselves and no-one else as graders", () => {
    cy.login('grader')
    cy.visit("/")
    cy.get('[data-cy=grader-selection]')
      .click()
    cy.get('span').contains('grader')
    cy.get('span').contains('secondGrader').should('not.exist')
    cy.get('span').contains('admin').should('not.exist')
    cy.get('span').contains('regular').should('not.exist')
    cy.logout()
  })

  it('Grader should not be able to see reports where they are not graders', () => {
    cy.login('grader').visit('')
    cy.get('[data-cy=nav-reports]').click()
    cy.get('[data-cy=sis-reports-tab]').click()
    cy.get('[data-cy=report-TKT10002]').should('not.exist')
    cy.get('[data-cy=report-TKT21018]').should('not.exist')
    cy.get('[data-cy=report-CSM14113]').should('not.exist')
    cy.get('[data-cy=report-TKT200011]').should('not.exist')
    cy.logout()
  })

  it("Regular users should not see form tab and should not be able to post entries", () => {
    cy.login('regular').visit('')
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
        graderId:2,
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(500)
    })
    cy.logout()
  })
})