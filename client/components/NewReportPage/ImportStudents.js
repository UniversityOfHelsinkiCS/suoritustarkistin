import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Icon, Modal, Table, Segment, Button, Message, Input } from 'semantic-ui-react'
import moment from 'moment'
import { importStudentsAction } from '../../utils/redux/newRawEntriesReducer'

const styles = {
  tdPadded: {
    paddingLeft: '3rem'
  },
  input: {
    width: '35px'
  },
  table: {
    maxHeight: '600px',
    overflow: 'auto',
    marginTop: '1.5rem'
  },
  confirmTable: {
    width: '50%',
    marginLeft: 'auto',
    marginRight: 'auto'
  }
}


export default ({ isOpen, setIsOpen, importRows }) => {
  const dispatch = useDispatch()
  const [openAccordions, setOpenAccordions] = useState(new Set())
  const [grades, setGrades] = useState({})
  const [confirm, setConfirm] = useState(false)
  const { defaultCourse } = useSelector((state) => state.newRawEntries)
  const { data, pending, error } = useSelector((state) => state.newRawEntries.importStudents)

  useEffect(() => {
    if (defaultCourse)
      dispatch(importStudentsAction(defaultCourse))
  }, [defaultCourse])

  const set = ({ value: grade }, person) => setGrades({
    ...grades,
    [person.studentNumber]: { name: `${person.firstNames} ${person.lastName}`, grade }
  })


  const get = (studentNumber) => {
    if (!grades[studentNumber]) return ''
    return grades[studentNumber].grade
  }

  const openAccordion = (key) => setOpenAccordions(new Set(openAccordions.add(key)))
  const closeAccordion = (key) => {
    if (openAccordions.delete(key))
      setOpenAccordions(new Set(openAccordions))
  }

  const Accordion = ({ rows, title, open, close, isOpen }) => <>
    <Table.Row>
      <Table.Cell />
      <Table.Cell>
        <span onClick={() => isOpen ? close(title) : open(title)} style={{ cursor: 'pointer' }}>
          <Icon name={`triangle ${isOpen ? 'down' : 'right'}`} />
          {title}
        </span>
      </Table.Cell>
    </Table.Row>
    {isOpen
      ? <>{rows.map(({ person, id }) => <Table.Row key={id}>
        <Table.Cell>
          <Input
            size="mini"
            style={styles.input}
            value={get(person.studentNumber)}
            onChange={(_, data) => set(data, person)} />
        </Table.Cell>
        <Table.Cell style={styles.tdPadded}>{`${person.firstNames} ${person.lastName} (${person.studentNumber})`}</Table.Cell>
      </Table.Row>)}
      </> : null}
  </>

  return <Modal
    open={isOpen}
    onClose={() => setIsOpen(false)}
  >
    <Modal.Header>Select students to import</Modal.Header>
    {confirm
      ? <SummaryTable rows={grades} />
      : <Modal.Content >
        {error
          ? <Message error>
            Failed to fetch enrollments.
          </Message>
          : null}
        <Segment loading={pending} style={styles.table} basic>
          {
            data.length || pending
              ? <>
                <Message info>Select students by typing a grade for each student to import.</Message>
                <Table compact celled>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Grade</Table.HeaderCell>
                      <Table.HeaderCell>Student</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {data.map((r) => {
                      const title = getTitle(r)
                      return <Accordion
                        title={title}
                        rows={r.enrollments}
                        key={title}
                        isOpen={openAccordions.has(title)}
                        close={closeAccordion}
                        open={openAccordion} />
                    }
                    )}
                  </Table.Body>
                </Table>
              </>
              : <Message info>{`No enrollments found for course ${defaultCourse}`}</Message>
          }
        </Segment>
      </Modal.Content>
    }

    <Modal.Actions >
      <Button
        onClick={() => {
          if (confirm)
            return setConfirm(false)
          setIsOpen(false)
        }}
        disabled={pending}
        negative>
        Cancel
      </Button>
      <Button positive
        onClick={() => {
          if (!confirm)
            return setConfirm(true)
          importRows(grades)
          setIsOpen(false)
        }}
        disabled={pending || !Object.keys(grades).length}>
        {!confirm ? 'Import' : 'Confirm'}
      </Button>
    </Modal.Actions>
  </Modal>
}


const SummaryTable = ({ rows }) => <Table style={styles.confirmTable} compact celled>
  <Table.Header>
    <Table.Row>
      <Table.HeaderCell>Student</Table.HeaderCell>
      <Table.HeaderCell>Grade</Table.HeaderCell>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {Object.keys(rows).map((key) => {
      const { name, grade } = rows[key]
      return <Table.Row key={name}>
        <Table.Cell>{`${name} (${key})`}</Table.Cell>
        <Table.Cell>{grade}</Table.Cell>
      </Table.Row>
    }
    )}
  </Table.Body>
</Table>

const getTitle = (row) => {
  const includeYearToStart = moment(row.activityPeriod.startDate).get('year') !== moment(row.activityPeriod.endDate).get('year')
  const start = moment(row.activityPeriod.startDate).format(includeYearToStart ? 'DD.MM.YYYY' : 'DD.MM.')
  const end = moment(row.activityPeriod.endDate).subtract(1, 'day').format('DD.MM.YYYY')
  return `${row.name.fi} (${start} - ${end}), ${row.enrollments.length} student(s)`
}
