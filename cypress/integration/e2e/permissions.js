/// <reference types="Cypress" />

describe("Permissions", () => {

  before(() => {
    cy.request('DELETE', '/api/users')

    cy.request('POST', '/api/users', {
      name: 'admin',
      employeeId: '123',
      isAdmin: true,
      isGrader: false
    })
    cy.request('POST', '/api/users', {
      name: 'grader',
      employeeId: '111',
      isAdmin: false,
      isGrader: true
    })
    cy.request('POST', '/api/users', {
      name: 'user',
      employeeId: '321',
      isAdmin: false,
      isGrader: false
    })
  })

  it("Users with employeeId and isGrader=false see who they should contact to get permissions", () => {    
    cy.request('POST', '/api/users', {
      name: 'employeeIsGraderFalse',
      employeeId: 'employeeIsGraderFalse',
      isAdmin: false,
      isGrader: false
    })

    cy.server({
      onAnyRequest: (route, proxy) => {
        proxy.xhr.setRequestHeader('employeenumber', 'employeeIsGraderFalse')
      }
    })

    cy.visit("/")
    cy.url().should("include","/unauthorized")

    cy.contains("New report").should("have.class","disabled")
    cy.contains("View reports").should("have.class","disabled")
    cy.contains("Your account has been created.")
    cy.contains("you must send an email")
  })

  it("Users without employeeId see 'Employees only' message", () => {
    cy.server({
      onAnyRequest: (route, proxy) => {
        proxy.xhr.setRequestHeader('name',"noEmployeeid")
      }
    })

    cy.visit("/")
    cy.contains("This service is for employees only.")
    cy.contains("To use the service, you need to have an employee number.")
  })

  it("Admin users should be able to see the sis-form tab", () => {
    cy.asAdmin().visit('')
    cy.get('[data-cy=adminmode-enable]').click()
    cy.get('[data-cy=sis-copypaste]')
  })

  it("Regular users should not see sis-form tab and should not be able to post entries", () => {
    cy.asUser().visit('')

    cy.get('[data-cy=sis-copypaste]').should('not.exist')

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
        graderId:"321",
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(500)
    })
  })

  it("Grader users should not see sis-form tab and should not be able to post entries", () => {
    cy.asGrader().visit('')

    cy.get('[data-cy=sis-copypaste]').should('not.exist')

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
        graderId:"321",
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(500)
    })
  })


  it("Regular users should not be able to see the sis-reports tab and should not be able to fetch sis-reports", () => {
    cy.asUser().visit('')
    cy.wait(1000)
    cy.get('[data-cy=adminmode-enable]').should('not.exist')
    cy.get('[data-cy=nav-sis-reports').should('not.exist')

    cy.request({
      method: 'GET',
      url: 'api/sis_reports',
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(500)
    })
  })

  it("Graders should not be able to see the sis-reports tab and should not be able to fetch sis-reports", () => {
    cy.asGrader().visit('')
    cy.wait(1000)
    cy.get('[data-cy=adminmode-enable]').should('not.exist')
    cy.get('[data-cy=nav-sis-reports').should('not.exist')

    cy.request({
      method: 'GET',
      url: 'api/sis_reports',
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(500)
    })
  })

})