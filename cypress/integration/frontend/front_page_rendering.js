describe('Front page is rendered', () => {
  it('Visits front page', () => {
    cy.visit('localhost:3000')
    cy.get('[data-cy=userguide]')
  })
})
