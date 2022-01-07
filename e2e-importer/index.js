const express = require('express')
const app = express()
const port = 3000

const mock = require('./data.json')

app.get('/grades', (req, res) => res.send(mock.grades))
app.post('/students', (req, res) => res.send(mock.students))
app.get('/employees/9111111', (req, res) => res.send(mock.employees))
app.post('/suotar/enrolments/', (req, res) => res.send(mock.enrolments))
app.post('/suotar/study-rights/', (req, res) => res.send(mock.studyRights))
app.post('/suotar/course-unit-ids/', (req, res) => res.send(mock.courseUnitIds))
app.post('/suotar/study-rights-by-person/', (req, res) => res.send(mock.studyRightsByPeron))
app.post('/suotar/acceptors/', (req, res) => res.send(mock.acceptors))
app.post('/suotar/acceptors/course-unit', (req, res) => res.send(mock.acceptorsCourseUnits))
app.post('/suotar/attainments/', (req, res) => res.send(mock.attainments))
app.post('/suotar/', (req, res) => res.send([]))
app.post('/suotar/send/course-unit-attainment/', (req, res) => res.send([]))

app.listen(port, () => {
  console.log(`Importer mock http://localhost:${port}`)
})
