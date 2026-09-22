/// <reference types="Cypress" />

/**
 * Proof of concept for the courses.mooc.fi batch API. Covers section 1 only; the rest of the
 * API is exercised by the node:test suites, which can reach the database directly.
 */

const PATH = '/api/persons/resolve-by-student-numbers'

// From e2e-importer/data.json. The fixture replayer ignores the request body and always
// answers with every student it has, so the matching under test is Suotar's own.
const ALPO = {
  studentNumber: '014979622',
  personId: 'hy-hlo-125563414',
  firstNames: 'Alpo',
  lastName: 'Petras'
}

describe('courses.mooc.fi API', () => {
  let token

  before(() => {
    cy.request('/api/seed/no-entries')
    cy.request({
      method: 'POST',
      url: '/api/api_keys',
      // cy.request bypasses the client, so the Shibboleth headers mockHeaders would set are
      // sent by hand. employeenumber 1111 is the seeded admin.
      headers: { employeenumber: '1111', uid: 'admin', mail: 'admin@helsinki.fi', givenname: 'Admin', sn: 'User' },
      body: { name: 'cypress', client: 'moocfi' }
    }).then(({ body }) => {
      token = body.token
    })
  })

  it('resolves a student number to the person Sisu holds', () => {
    cy.request({
      method: 'POST',
      url: PATH,
      headers: { token },
      body: [{ requestItemId: 'person-1', studentNumber: ALPO.studentNumber }]
    }).then(({ status, body }) => {
      expect(status).to.eq(200)
      expect(body).to.deep.eq([
        {
          requestItemId: 'person-1',
          status: 'ok',
          code: 'personFound',
          result: {
            studentNumber: ALPO.studentNumber,
            personId: ALPO.personId,
            firstNames: ALPO.firstNames,
            lastName: ALPO.lastName
          }
        }
      ])
    })
  })

  it('answers personNotFound for a student number Sisu does not have', () => {
    cy.request({
      method: 'POST',
      url: PATH,
      headers: { token },
      body: [{ requestItemId: 'person-1', studentNumber: '000000000' }]
    }).then(({ body }) => {
      expect(body[0].status).to.eq('error')
      expect(body[0].code).to.eq('personNotFound')
    })
  })

  it('refuses a request with no API key', () => {
    cy.request({
      method: 'POST',
      url: PATH,
      body: [{ requestItemId: 'person-1', studentNumber: ALPO.studentNumber }],
      failOnStatusCode: false
    }).then(({ status, body }) => {
      expect(status).to.eq(401)
      expect(body.error.code).to.eq('unauthorized')
    })
  })
})
