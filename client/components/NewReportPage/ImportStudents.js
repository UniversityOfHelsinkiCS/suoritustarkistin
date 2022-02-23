import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Icon, Modal, Table, Segment, Button, Message, Dropdown, Popup, Placeholder, Label, Checkbox } from 'semantic-ui-react'
import moment from 'moment'
import { importStudentsAction, importStudentsAttainments } from '../../utils/redux/newRawEntriesReducer'

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
  },
  label: {
    margin: '0.125rem'
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

const renderAttainments = ({ attainments: attainmentsForStudent }) => {
  const earlierAttainments = attainmentsForStudent.map(({ gradeScaleId, state, grade, attainmentDate, personId }) => {
    const getGradeString = () => {
      if (state === 'FAILED') return 'Failed'
      if (gradeScaleId === 'sis-hyl-hyv') return grade.name.en
      return grade.numericCorrespondence
    }
    const date = moment(attainmentDate).format('DD.MM.YYYY')
    const gradeString = getGradeString()
    return <Label key={`${personId}${gradeString}${date}`} color={state === 'FAILED' ? 'red' : 'green'} style={styles.label}>
      {gradeString}, {date}
    </Label>
  })

  // Remove duplicates caused by AssesmentItemAttainment --> CourseUnitAttainment
  return [...new Map(earlierAttainments.map(({ key, ...item }) => [key, { ...item, key }])).values()]
}

const Accordion = ({ rows, title, get, set, date, gradeScale, fetchAttainments, allAttainments, hideWithAttainment }) => {
  const openAccordion = () => {
    if (!open)
      fetchAttainments(rows.map(({ person }) => person.studentNumber))
    setOpen(!open)
  }

  const [open, setOpen] = useState(false)

  return <>
    <Table.Row>
      <Table.Cell>
        <span onClick={openAccordion} style={{ cursor: 'pointer' }}>
          <Icon name={`triangle ${open ? 'down' : 'right'}`} />
          {title}
        </span>
      </Table.Cell>
      <Table.Cell />
    </Table.Row>
    {open
      ? <>{rows
        .filter(({ person }) => {
          if (!hideWithAttainment) return true
          const completions = allAttainments.data.find((a) => a.studentNumber === person.studentNumber)
          return completions ?
            completions.attainments.every(({ state }) => state === 'FAILED')
            : true
        })
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
          <Table.Cell width={5}>
            {
              allAttainments.pending && !allAttainments.data.find((a) => a.studentNumber === person.studentNumber)
                ? <Placeholder>
                  <Placeholder.Line length="very long" />
                  <Placeholder.Line length="long" />
                </Placeholder>
                : renderAttainments(
                  allAttainments.data
                    ? allAttainments.data.find((a) => a.studentNumber === person.studentNumber) || { attainments: [] }
                    : { attainments: [] })
            }
          </Table.Cell>
        </Table.Row>)}
      </> : null}
  </>
}

export default ({ isOpen, setIsOpen, importRows }) => {
  const dispatch = useDispatch()
  const [grades, setGrades] = useState({})
  const [confirm, setConfirm] = useState(false)
  const [hideWithAttainment, setHideWithAttainment] = useState(false)
  const { defaultCourse } = useSelector((state) => state.newRawEntries)
  const { data, pending, error } = useSelector((state) => state.newRawEntries.importStudents)
  const { ...attainments } = useSelector((state) => state.newRawEntries.importStudentsAttainments)

  useEffect(() => {
    if (defaultCourse) {
      dispatch(importStudentsAction(defaultCourse))
      setGrades({})
    }
  }, [defaultCourse])

  const fetchAttainments = (students) => dispatch(importStudentsAttainments(
    students.map((studentNumber) => ({ studentNumber, courseCode: defaultCourse }))
  ))

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
                <Message info>Select students by selecting a grade for each student to import.</Message>
                <Checkbox
                  label="Hide students with earlier completion"
                  onChange={(_, { checked }) => setHideWithAttainment(checked)}
                  checked={hideWithAttainment}
                  toggle />
                <Table compact celled>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Students</Table.HeaderCell>
                      <Table.HeaderCell>Earlier completions</Table.HeaderCell>
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
                          allAttainments={attainments}
                          hideWithAttainment={hideWithAttainment}
                          fetchAttainments={fetchAttainments}
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
