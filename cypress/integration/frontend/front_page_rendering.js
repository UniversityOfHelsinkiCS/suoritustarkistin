describe('Front page is rendered', () => {
  it('Visits front page', () => {
    cy.visit('')
    cy.get('[data-cy=userguide]')
  })
})
