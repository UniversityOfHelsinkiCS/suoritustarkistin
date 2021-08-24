import React from 'react'
import { Form, Header, Input, Radio } from 'semantic-ui-react'


export const filterBatches = (report, filters) => {
  let match = false
  if (!filters.errors && !filters.missing && !filters.notSent && !filters.noEnrollment) match = true

  const containsErrors = report.some(({ entry }) => (!entry || ((entry.errors || {}).message)))
  const notSent = report.every(({ entry }) => !entry || !entry.sent)
  const missingFromSisu = report.some(({ entry }) => (!entry || (entry.sent && !(entry.errors || {}).message && !entry.registered)))
  const missingEnrollment = report.some(({ entry }) => !entry || entry.missingEnrolment)
  if (filters.errors && containsErrors) match = true
  if (filters.missing && missingFromSisu) match = true
  if (filters.notSent && notSent) match = true
  if (filters.notSent && notSent) match = true
  if (filters.noEnrollment && missingEnrollment) match = true

  const studentNumberMatch = report.some((rawEntry) => rawEntry.studentNumber.includes(filters.search))
  return match && (filters.search ? studentNumberMatch : true)
}

export default ({ filters, setFilters }) => {
  const toggleFilter = (name) => setFilters({ ...filters, [name]: !filters[name] })
  const setSearch = (event) => setFilters({ ...filters, search: event.target.value })

  return <>
    <Header as='h3'>Include reports with:</Header>
    <Form>
      <Form.Group>
        <Form.Field
          control={Radio}
          label='Contains errors'
          checked={filters.errors}
          onChange={() => toggleFilter('errors')}
          toggle />
        <Form.Field
          control={Radio}
          label='Not sent to Sisu'
          checked={filters.notSent}
          onChange={() => toggleFilter('notSent')}
          toggle />
        <Form.Field
          control={Radio}
          label='Missing enrollments'
          checked={filters.noEnrollment}
          onChange={() => toggleFilter('noEnrollment')}
          toggle />
        <Form.Field
          control={Radio}
          label='Sent missing from Sisu'
          checked={filters.missing}
          onChange={() => toggleFilter('missing')}
          toggle />
      </Form.Group>
      <Form.Group>
        <Form.Field
          control={Input}
          label='Filter by student number'
          value={filters.search}
          onChange={setSearch} />
      </Form.Group>
    </Form>
  </>
}
