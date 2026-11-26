/* oxlint-disable no-console */
const express = require('express')
const app = express()
const port = 3000

const mock = require('./data.json')

app.use(express.json())

// The fixtures only know a course unit for TKT21015 and a study right for one student.
// Anything else asked for gets a copy of those, so any course and student can be tried in dev.
const courseUnitsFor = (codes = []) =>
  Object.fromEntries(
    codes.map((code) => [
      code,
      mock.courseUnitIds[code] ||
        mock.courseUnitIds.TKT21015.map((unit) => ({ ...unit, id: `hy-CU-dev-${code}`, code }))
    ])
  )

const studyRightsFor = (personIds = []) => {
  const known = new Set(mock.studyRightsByPeron.map(({ personId }) => personId))
  const template = mock.studyRightsByPeron.filter(({ personId }) => personId === mock.studyRightsByPeron[0].personId)
  const copies = personIds
    .filter((personId) => !known.has(personId))
    .flatMap((personId) => template.map((right) => ({ ...right, id: `${right.id}-${personId}`, personId })))
  return mock.studyRightsByPeron.concat(copies)
}

app.get('/grades', (req, res) => res.send(mock.grades))
app.post('/students', (req, res) => res.send(mock.students))
// Any employee number resolves to the one fixture employee, so every dev user can grade
app.get('/employees/:employeeNumber', (req, res) =>
  res.send(mock.employees.map((employee) => ({ ...employee, employeeNumber: req.params.employeeNumber })))
)
app.post('/suotar/enrolments/', (req, res) => res.send(mock.enrolments))
app.post('/suotar/study-rights/', (req, res) => res.send(mock.studyRights))
app.post('/suotar/course-unit-ids/', (req, res) => res.send(courseUnitsFor(req.body)))
app.post('/suotar/study-rights-by-person/', (req, res) => res.send(studyRightsFor(req.body)))
app.post('/suotar/acceptors/', (req, res) => res.send(mock.acceptors))
app.post('/suotar/acceptors/course-unit', (req, res) => res.send(mock.acceptorsCourseUnits))
app.post('/suotar/attainments/', (req, res) => res.send(mock.attainments))
app.post('/suotar/', (req, res) => res.send([]))
app.post('/suotar/send/course-unit-attainment/', (req, res) => res.send([]))

app.listen(port, () => {
  console.log(`Importer mock http://localhost:${port}`)
})
