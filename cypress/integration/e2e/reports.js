describe('Submitting data creates a valid report into database', function () {
  beforeEach(function () {
    cy.server({
      onAnyRequest: (route, proxy) => {
        proxy.xhr.setRequestHeader('employeenumber', Cypress.env('ADMIN_EMPLOYEE_NUMBER'))
      },
    })
    cy.request('DELETE', '/api/seed/courses')
    cy.request('DELETE', '/api/seed/users')
    cy.request('DELETE', '/api/seed/reports')

    cy.request('POST', '/api/seed/users', {
      name: 'admin',
      employeeId: Cypress.env('ADMIN_EMPLOYEE_NUMBER'),
      isAdmin: true,
      isGrader: false,
    })
    cy.request('POST', '/api/seed/users', {
      name: 'grader',
      employeeId: Cypress.env('GRADER_EMPLOYEE_NUMBER'),
      isAdmin: false,
      isGrader: true,
    }).then((response) => {
      cy.request('POST', '/api/courses', {
        name: 'avoimen kurssi',
        courseCode: 'AYTKTTEST',
        language: 'fi',
        credits: '8,0',
        graders: [response.body.id],
      })
      cy.request('POST', '/api/courses', {
        name: 'tkt:n kurssi',
        courseCode: 'TKTTEST',
        language: 'en',
        credits: '8,0',
        graders: [response.body.id],
      })
    })
  })

  it('When pasting (typing) Finnish open university course by grader into text field', () => {
    cy.asGrader().visit('')
    cy.get('[data-cy=create-report-button]').should('be.disabled')
    cy.get('[data-cy=pastefield]').type(
      '010000003;2;5;fi\n011000002;;2,0\n011100009\n011110002;;;fi',
      {
        delay: 1,
      }
    )
    cy.get('[data-cy=dateField]').children().clear().type('5.7.2019')
    cy.get('[data-cy=graderSelection]')
      .click()
      .children()
      .contains('grader')
      .click()

    cy.get('[data-cy=courseSelection]')
      .click()
      .children()
      .contains('avoimen kurssi (AYTKTTEST)')
      .click()

    cy.get('[data-cy=create-report-button]')
      .should('not.be.disabled')
      .click()

    cy.get('[data-cy=confirm-sending-button]')
      .should('be.visible')
      .click()

    cy.get('[data-cy=create-report-button]')
      .should('be.disabled')

    cy.wait(1000)

    cy.request({
      url: 'api/seed/reports/list',
      headers: {
        Authorization: Cypress.env('SUOTAR_TOKEN'),
      },
    }).should((response) => {
      expect(response.body.length).to.equal(1)
      cy.request({
        url: `api/reports/${response.body[0].id}`,
        headers: {
          Authorization: Cypress.env('SUOTAR_TOKEN'),
        },
      }).should((response) => {
        const { fileName, data } = response.body
        expect(fileName).to.contain('AYTKTTEST%')
        expect(fileName).to.contain('_MANUAL.dat')
        expect(data).to.equal(
          '010000003##1#AYTKTTEST#avoimen kurssi#5.7.2019#0#2#106##111#2#H930#11#93013#3##5,0\n011000002##1#AYTKTTEST#avoimen kurssi#5.7.2019#0#Hyv.#106##111#2#H930#11#93013#3##2,0\n011100009##1#AYTKTTEST#avoimen kurssi#5.7.2019#0#Hyv.#106##111#2#H930#11#93013#3##8,0\n011110002##1#AYTKTTEST#avoimen kurssi#5.7.2019#0#Hyv.#106##111#2#H930#11#93013#3##8,0'
        )
      })
    })
  })

  it('When pasting (typing) English tkt course by grader into text field', () => {
    cy.asGrader().visit('')
    cy.get('[data-cy=create-report-button]').should('be.disabled')
    cy.get('[data-cy=pastefield]').type(
      '010000003;2;5;fi\n011000002;;2,0\n011100009\n011110002;;;fi',
      {
        delay: 1,
      }
    )
    cy.get('[data-cy=dateField]').children().clear().type('5.7.2019')
    cy.get('[data-cy=graderSelection]')
      .click()
      .children()
      .contains('grader')
      .click()

    cy.get('[data-cy=courseSelection]')
      .click()
      .children()
      .contains('tkt:n kurssi (TKTTEST)')
      .click()

    cy.get('[data-cy=create-report-button]')
      .should('not.be.disabled')
      .click()

    cy.get('[data-cy=confirm-sending-button]')
      .should('be.visible')
      .click()

    cy.get('[data-cy=create-report-button]')
      .should('be.disabled')

    cy.wait(1000)

    cy.request({
      url: 'api/seed/reports/list',
      headers: {
        Authorization: Cypress.env('SUOTAR_TOKEN'),
      },
    }).should((response) => {
      expect(response.body.length).to.equal(1)
      cy.request({
        url: `api/reports/${response.body[0].id}`,
        headers: {
          Authorization: Cypress.env('SUOTAR_TOKEN'),
        },
      }).should((response) => {
        const { fileName, data } = response.body
        expect(fileName).to.contain('TKTTEST%')
        expect(fileName).to.contain('_MANUAL.dat')
        expect(data).to.equal(
          '010000003##1#TKTTEST#tkt:n kurssi#5.7.2019#0#2#106##111#2#H523#####5,0\n011000002##6#TKTTEST#tkt:n kurssi#5.7.2019#0#Hyv.#106##111#2#H523#####2,0\n011100009##6#TKTTEST#tkt:n kurssi#5.7.2019#0#Hyv.#106##111#2#H523#####8,0\n011110002##1#TKTTEST#tkt:n kurssi#5.7.2019#0#Hyv.#106##111#2#H523#####8,0'
        )
      })
    })
  })

  it('When dragging (choosing) a file into dropzone', () => {
    cy.asGrader().visit('')
    cy.get('[data-cy=create-report-button]').should('be.disabled')
    cy.get('[data-cy=dragdrop]').click()
    cy.wait(1000)
    cy.fixture('valid.csv').then((content) => {
      cy.get('[data-cy=dropzone]').upload(content, 'valid.csv')
    })
    cy.get('[data-cy=dateField] input').clear().type('5.7.2019')
    cy.get('[data-cy=graderSelection]')
      .click()
      .children()
      .contains('grader')
      .click()

    cy.get('[data-cy=courseSelection]')
      .click()
      .children()
      .contains('tkt:n kurssi (TKTTEST)')
      .click()

    cy.get('[data-cy=create-report-button]')
      .should('not.be.disabled')
      .click()

    cy.get('[data-cy=confirm-sending-button]')
      .should('be.visible')
      .click()

    cy.get('[data-cy=create-report-button]')
      .should('be.disabled')

    cy.wait(1000)

    cy.request({
      url: 'api/seed/reports/list',
      headers: {
        Authorization: Cypress.env('SUOTAR_TOKEN'),
      },
    }).should((response) => {
      expect(response.body.length).to.equal(1)
      cy.request({
        url: `api/reports/${response.body[0].id}`,
        headers: {
          Authorization: Cypress.env('SUOTAR_TOKEN'),
        },
      }).should((response) => {
        const { fileName, data } = response.body
        expect(fileName).to.contain('TKTTEST%')
        expect(fileName).to.contain('_MANUAL.dat')
        expect(data).to.equal(
          '010000003##1#TKTTEST#tkt:n kurssi#5.7.2019#0#2#106##111#2#H523#####5,0\n011000002##6#TKTTEST#tkt:n kurssi#5.7.2019#0#Hyv.#106##111#2#H523#####2,0\n011100009##6#TKTTEST#tkt:n kurssi#5.7.2019#0#Hyv.#106##111#2#H523#####8,0\n011110002##1#TKTTEST#tkt:n kurssi#5.7.2019#0#Hyv.#106##111#2#H523#####8,0'
        )
      })
    })
  })
})
