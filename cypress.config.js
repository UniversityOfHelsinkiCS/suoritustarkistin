// Cypress >=10 replaced cypress.json with this file. The specPattern and
// supportFile entries preserve the pre-10 layout (cypress/integration/e2e/**,
// cypress/support/index.js) so no specs had to move during the Node 24 upgrade.
module.exports = {
  e2e: {
    baseUrl: 'http://localhost:8001',
    responseTimeout: 19000,
    video: false,
    viewportWidth: 1800,
    viewportHeight: 1800,
    specPattern: 'cypress/integration/e2e/**/*.js',
    supportFile: 'cypress/support/index.js',
    setupNodeEvents() {}
  }
}
