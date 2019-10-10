describe('Validation prevents submission of invalid data', function() {
  beforeEach(function() {
    cy.server({
      onAnyRequest: (route, proxy) => {
        proxy.xhr.setRequestHeader('employeenumber', '321')
      }
    })

    cy.request('DELETE', '/api/courses')
    cy.request('DELETE', '/api/users')
    cy.request('DELETE', '/api/reports')

    cy.request('POST', '/api/users', {
      name: 'testiope',
      employeeId: '123',
      isAdmin: true,
      isGrader: true
    })
    cy.request('POST', '/api/users', {
      name: 'testimaikka',
      employeeId: '321',
      isAdmin: false,
      isGrader: true
    }).then((response) => {
      cy.request('POST', '/api/courses', {
        name: 'avoimen kurssi',
        courseCode: 'AYTKTTEST',
        language: 'fi',
        credits: '8,0',
        graderId: response.body.id
      })
      cy.request('POST', '/api/courses', {
        name: 'tkt:n kurssi',
        courseCode: 'TKTTEST',
        language: 'en',
        credits: '8,0',
        graderId: response.body.id
      })
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

    cy.get('[data-cy=sendButton]').should('be.disabled')
    cy.get('[data-cy=graderSelection]')
      .click()
      .children()
      .contains('testimaikka')
      .click()
    cy.get('[data-cy=sendButton]').should('be.disabled')
    cy.get('[data-cy=courseSelection]')
      .click()
      .children()
      .contains('tkt:n kurssi (TKTTEST)')
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
      .contains('testimaikka')
      .click()

    cy.get('[data-cy=courseSelection]')
      .click()
      .children()
      .contains('tkt:n kurssi (TKTTEST)')
      .click()
  })
})
