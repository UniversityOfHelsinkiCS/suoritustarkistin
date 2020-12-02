/// <reference types="Cypress" />

describe("Permissions", () => {

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

})