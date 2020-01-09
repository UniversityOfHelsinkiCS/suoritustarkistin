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
      proxy.xhr.setRequestHeader('employeenumber', '123')
    }
  })
})

Cypress.Commands.add('asUser', () => {
  cy.server({
    onAnyRequest: (route, proxy) => {
      proxy.xhr.setRequestHeader('employeenumber', '321')
    }
  })
})
