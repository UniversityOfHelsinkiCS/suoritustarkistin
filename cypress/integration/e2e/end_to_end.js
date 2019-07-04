describe('End to End testing', () => {
  beforeEach(() => {
    cy.exec('npm run db:recreate')
    cy.request('POST', '/api/courses', {
      name: 'testikurssi',
      courseCode: 'AYTKTTEST',
      language: 'fi',
      credits: '8,0'
    })
    cy.request('POST', '/api/graders', {
      name: 'testiope',
      identityCode: '000000-000A'
    })
  })

  it('Submitting a report saves the information to database', () => {
    cy.visit('')
    cy.get('[data-cy=sendButton]').should('be.disabled')
    cy.get('[data-cy=pastefield]').type(
      '010000003;2;5;fi\n011000002;;2,0\n011100009\n011110002;;;fi',
      { delay: 1 }
    )
    cy.get('[data-cy=graderSelection]').click()
    cy.get('[data-cy=courseSelection]').click()
    cy.get('[data-cy=tokenField]').type(Cypress.env('CSV_TOKEN'))
    cy.get('[data-cy=sendButton]')
      .should('not.be.disabled')
      .click()
      .should('be.disabled')

    cy.request({
      url: 'api/reports/list',
      headers: {
        Authorization: Cypress.env('SUOTAR_TOKEN')
      }
    }).should((response) => {
      expect(response.body.length).to.equal(2)
    })
  })
})
