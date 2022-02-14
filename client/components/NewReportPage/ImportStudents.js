import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Icon, Modal, Table, Segment, Button, Message, Dropdown, Popup } from 'semantic-ui-react'
import moment from 'moment'
import { importStudentsAction } from '../../utils/redux/newRawEntriesReducer'

const styles = {
  tdPadded: {
    paddingLeft: '3rem'
  },
  input: {
    width: '3.5rem'
  },
  table: {
    minHeight: '420px',
    maxHeight: '600px',
    overflow: 'auto'
  },
  confirmTable: {
    width: '50%',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  dateHeader: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  dropdown: {
    marginRight: '1rem'
  }
}

const GRADES = {
  "sis-hyl-hyv": [
    {
      key: 'hyl.',
      text: 'Failed',
      value: 'hyl.'
    }, {
      key: 'hyv.',
      text: 'Pass',
      value: 'hyv.'
    }
  ],
  "sis-0-5": [
    {
      key: 'hyl.',
      text: 'Failed',
      value: 'hyl.'
    },
    {
      key: '1',
      text: '1',
      value: '1'
    },
    {
      key: '2',
      text: '2',
      value: '2'
    },
    {
      key: '3',
      text: '3',
      value: '3'
    },
    {
      key: '4',
      text: '4',
      value: '4'
    },
    {
      key: '5',
      text: '5',
      value: '5'
    }
  ]
}

const Accordion = ({ rows, title, get, set, date, gradeScale }) => {
  const [open, setOpen] = useState(false)
  return <>
    <Table.Row>
      <Table.Cell>
        <span onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
          <Icon name={`triangle ${open ? 'down' : 'right'}`} />
          {title}
        </span>
      </Table.Cell>
    </Table.Row>
    {open
      ? <>{rows
        .sort((a, b) => `${a.person.lastName}, ${a.person.firstNames} (${a.person.studentNumber})`.
          localeCompare(`${b.person.lastName}, ${b.person.firstNames} (${b.person.studentNumber})`))
        .map(({ person, id }) => <Table.Row key={id}>
          <Table.Cell style={styles.tdPadded}>
            <Dropdown
              placeholder='Grade'
              options={GRADES[gradeScale]}
              style={styles.dropdown}
              value={get(person.studentNumber)}
              onChange={(_, data) => set(data, person, date)}
              selection
              compact
              clearable />
            <span>{`${person.lastName}, ${person.firstNames} (${person.studentNumber})`}</span>
          </Table.Cell>
        </Table.Row>)}
      </> : null}
  </>
}

export default ({ isOpen, setIsOpen, importRows }) => {
  const dispatch = useDispatch()
  const [grades, setGrades] = useState({})
  const [confirm, setConfirm] = useState(false)
  const { defaultCourse } = useSelector((state) => state.newRawEntries)
  const { data, pending, error } = useSelector((state) => state.newRawEntries.importStudents)

  useEffect(() => {
    if (defaultCourse) {
      dispatch(importStudentsAction(defaultCourse))
      setGrades({})
    }
  }, [defaultCourse])

  const set = ({ value: grade }, person, date) => {
    if (!grade) {
      const newGrades = Object.assign({}, grades)
      delete newGrades[person.studentNumber]
      setGrades(newGrades)
    }
    else
      setGrades({
        ...grades,
        [person.studentNumber]: { name: `${person.lastName}, ${person.firstNames}`, grade: grade, date }
      })
  }


  const get = (studentNumber) => {
    if (!grades[studentNumber]) return ''
    return grades[studentNumber].grade
  }

  const close = () => {
    setGrades({})
    setIsOpen(false)
    setConfirm(false)
  }

  return <Modal
    open={isOpen}
    size="large"
    onClose={close}
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
                      <Table.HeaderCell>Student</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {data
                      .sort((a, b) => moment(b.activityPeriod.startDate).diff(moment(a.activityPeriod.startDate)))
                      .map((r) => {
                        const title = getTitle(r)
                        return <Accordion
                          title={title}
                          rows={r.enrollments}
                          gradeScale={r.gradeScaleId}
                          date={
                            moment(r.activityPeriod.startDate).isSame(moment(r.activityPeriod.endDate).subtract(1, 'day'), 'days')
                              ? moment(r.activityPeriod.startDate).format('D.M.YYYY')
                              : null
                          }
                          key={title}
                          get={get}
                          set={set} />
                      })
                    }
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
          close()
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
          close()
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
      <Table.HeaderCell style={styles.dateHeader}>Date
        <Popup
          content={"Completion date is added automatically if importing students from an exam"}
          trigger={<Icon name="help" size="small" circular />} />
      </Table.HeaderCell>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {Object.keys(rows).map((key) => {
      const { name, grade, date } = rows[key]
      return <Table.Row key={name}>
        <Table.Cell>{`${name} (${key})`}</Table.Cell>
        <Table.Cell>{grade}</Table.Cell>
        <Table.Cell>{date}</Table.Cell>
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
