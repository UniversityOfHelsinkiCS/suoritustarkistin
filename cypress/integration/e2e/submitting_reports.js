describe('Submitting data creates a valid report into database', () => {
  beforeEach(() => {
    cy.exec('npm run db:recreate')
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
    cy.get('[data-cy=sendButton]').should('be.disabled')
    cy.get('[data-cy=pastefield]').type(
      '010000003;2;5;fi\n011000002;;2,0\n011100009\n011110002;;;fi',
      { delay: 1 }
    )
    cy.get('[data-cy=dateField]')
      .clear()
      .type('5.7.2019')
  })

  it('When pasting (typing) Finnish open university course by testimaikka into text field', () => {
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
      expect(response.body.length).to.equal(2) // db has one entry after recreation, here we check a new one has been added
    })

    cy.request({
      url: 'api/reports/2',
      headers: {
        Authorization: Cypress.env('SUOTAR_TOKEN')
      }
    }).should((response) => {
      const { fileName, data } = response.body
      expect(fileName).to.equal('AYTKTTEST%5.7.19-V1-S2019.dat')
      expect(data).to.equal(
        '010000003##1#AYTKTTEST#avoimen kurssi#5.7.2019#0#2#106##000000-000B#1#H930#11#93013#3##5,0\n011000002##1#AYTKTTEST#avoimen kurssi#5.7.2019#0#Hyv.#106##000000-000B#1#H930#11#93013#3##2,0\n011100009##1#AYTKTTEST#avoimen kurssi#5.7.2019#0#Hyv.#106##000000-000B#1#H930#11#93013#3##8,0\n011110002##1#AYTKTTEST#avoimen kurssi#5.7.2019#0#Hyv.#106##000000-000B#1#H930#11#93013#3##8,0'
      )
    })
  })

  it('When pasting (typing) English tkt course by testiope into text field', () => {
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
      expect(response.body.length).to.equal(2) // db has one entry after recreation, here we check a new one has been added
    })

    cy.request({
      url: 'api/reports/2',
      headers: {
        Authorization: Cypress.env('SUOTAR_TOKEN')
      }
    }).should((response) => {
      const { fileName, data } = response.body
      expect(fileName).to.equal('TKTTEST%5.7.19-V1-S2019.dat')
      expect(data).to.equal(
        '010000003##1#TKTTEST#tkt:n kurssi#5.7.2019#0#2#106##000000-000A#1#H523#####5,0\n011000002##6#TKTTEST#tkt:n kurssi#5.7.2019#0#Hyv.#106##000000-000A#1#H523#####2,0\n011100009##6#TKTTEST#tkt:n kurssi#5.7.2019#0#Hyv.#106##000000-000A#1#H523#####8,0\n011110002##1#TKTTEST#tkt:n kurssi#5.7.2019#0#Hyv.#106##000000-000A#1#H523#####8,0'
      )
    })
  })

  // it('When dragging (choosing) a file into dropzone', () => {})
})
