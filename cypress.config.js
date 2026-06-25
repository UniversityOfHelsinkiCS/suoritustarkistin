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
