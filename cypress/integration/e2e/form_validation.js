describe('Validation prevents submission of invalid data', function() {
  beforeEach(function() {
    cy.request('DELETE', '/api/courses')
    cy.request('DELETE', '/api/graders')
    cy.request('DELETE', '/api/reports')

    cy.request('POST', '/api/courses', {
      name: 'avoimen kurssi',
      courseCode: 'AYTKTTEST',
      language: 'fi',
      credits: '8,0'
    })
    cy.request('POST', '/api/courses', {
      name: 'tkt:n kurssi',
      courseCode: 'TKTTEST',
      language: 'en',
      credits: '8,0'
    })
    cy.request('POST', '/api/graders', {
      name: 'testiope',
      identityCode: '000000-000A'
    })
    cy.request('POST', '/api/graders', {
      name: 'testimaikka',
      identityCode: '000000-000B'
    })
    cy.visit('')
  })

  it('when pasted data is invalid', () => {
    cy.get('[data-cy=sendButton]').should('be.disabled')
    cy.get('[data-cy=pastefield]').type(
      '010000002;7;2,2;se\n011000002;;2,0\n011100009\n011110002;;;fi',
      { delay: 1 }
    )
    cy.get('[data-cy=dateField]')
      .children()
      .clear()
      .type('5.7.2019')

    cy.get('[data-cy=graderSelection]')
      .click()
      .children()
      .contains('testimaikka')
      .click()

    cy.get('[data-cy=courseSelection]')
      .click()
      .children()
      .contains('avoimen kurssi (AYTKTTEST)')
      .click()

    cy.get('[data-cy=sendButton]').should('be.disabled')
  })

  it('when there are missing fields', () => {
    cy.get('[data-cy=sendButton]').should('be.disabled')

    // missing course
    cy.get('[data-cy=pastefield]').type(
      '010000003;2;5;fi\n011000002;;2,0\n011100009\n011110002;;;fi',
      { delay: 1 }
    )
    cy.get('[data-cy=dateField]')
      .children()
      .clear()
      .type('5.7.2019')

    cy.get('[data-cy=tokenField]')
      .children()
      .type(Cypress.env('CSV_TOKEN'))
    cy.get('[data-cy=sendButton]').should('be.disabled')
    cy.get('[data-cy=graderSelection]')
      .click()
      .children()
      .contains('testiope')
      .click()
    cy.get('[data-cy=sendButton]').should('be.disabled')
    cy.get('[data-cy=courseSelection]')
      .click()
      .children()
      .contains('tkt:n kurssi (TKTTEST)')
      .click()
    cy.get('[data-cy=sendButton]').should('not.be.disabled')

    // missing grader
    cy.visit('')
    cy.get('[data-cy=sendButton]').should('be.disabled')
    cy.get('[data-cy=pastefield]').type(
      '010000003;2;5;fi\n011000002;;2,0\n011100009\n011110002;;;fi',
      { delay: 1 }
    )
    cy.get('[data-cy=dateField]')
      .children()
      .clear()
      .type('5.7.2019')

    cy.get('[data-cy=tokenField]')
      .children()
      .type(Cypress.env('CSV_TOKEN'))
    cy.get('[data-cy=sendButton]').should('be.disabled')

    cy.get('[data-cy=courseSelection]')
      .click()
      .children()
      .contains('tkt:n kurssi (TKTTEST)')
      .click()
    cy.get('[data-cy=sendButton]').should('be.disabled')
    cy.get('[data-cy=graderSelection]')
      .click()
      .children()
      .contains('testiope')
      .click()
    cy.get('[data-cy=sendButton]').should('not.be.disabled')

    // missing data
    cy.get('[data-cy=pastefield]').clear()
    cy.get('[data-cy=sendButton]').should('be.disabled')
    cy.get('[data-cy=pastefield]').type(
      '010000003;2;5;fi\n011000002;;2,0\n011100009\n011110002;;;fi',
      { delay: 1 }
    )
    cy.get('[data-cy=sendButton]').should('not.be.disabled')

    // missing token
    cy.get('[data-cy=tokenField]')
      .children()
      .clear()
    cy.get('[data-cy=sendButton]').should('be.disabled')
    cy.get('[data-cy=tokenField]')
      .children()
      .type(Cypress.env('CSV_TOKEN'))
    cy.get('[data-cy=sendButton]').should('not.be.disabled')

    // missing date
    cy.get('[data-cy=dateField]')
      .children()
      .clear()
    cy.get('[data-cy=sendButton]').should('be.disabled')
    cy.get('[data-cy=dateField]')
      .children()
      .clear()
      .type('5.7.2019')
    cy.get('[data-cy=sendButton]').should('not.be.disabled')
  })

  it('when uploaded data is invalid', () => {
    cy.get('[data-cy=sendButton]').should('be.disabled')
    cy.get('[data-cy=dragdrop]').click()
    cy.fixture('invalid.csv').then((content) => {
      cy.get('[data-cy=dropzone]').upload(content, 'invalid.csv')
    })
    cy.get('[data-cy=dateField]')
      .children()
      .clear()
      .type('5.7.2019')
    cy.get('[data-cy=graderSelection]')
      .click()
      .children()
      .contains('testiope')
      .click()

    cy.get('[data-cy=courseSelection]')
      .click()
      .children()
      .contains('tkt:n kurssi (TKTTEST)')
      .click()

    cy.get('[data-cy=tokenField]')
      .children()
      .type(Cypress.env('CSV_TOKEN'))
    cy.get('[data-cy=sendButton]').should('be.disabled')
  })
})
