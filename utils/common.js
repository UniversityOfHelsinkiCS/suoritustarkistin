/**
 * Insert application wide common items here
 */
const moment = require('moment')

const inProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging' // staging is production ¯\_(ツ)_/¯
const inDevelopment = process.env.NODE_ENV === 'development'
const inTest = process.env.NODE_ENV === 'test'

const gradeScales = [
  {
    key: "sis-0-5",
    value: "sis-0-5",
    text: "sis-0-5"
  },
  {
    key: "sis-hyl-hyv",
    value: "sis-hyl-hyv",
    text: "sis-hyl-hyv"
  }
]

const getBatchId = (courseCode) => `${courseCode}-${moment().tz("Europe/Helsinki").format(
  'DD.MM.YY-HHmmss'
)}`

const testCourses = [
  {
    name: "Ohjelmoinnin perusteet",
    courseCode: "TKT10002",
    language: "fi",
    gradeScale: "sis-0-5"
  },
  {
    name: "Ohjelmoinnin jatkokurssi",
    courseCode: "TKT10003",
    language: "fi",
    gradeScale: "sis-0-5"
  }, 
  {
    name: "Elements of AI",
    courseCode: "TKT21018",
    language: "en",
    gradeScale: "sis-hyl-hyv"
  },
  {
    name: "Tietokoneen toiminta",
    courseCode: "TKT10005",
    language: "fi",
    gradeScale: "sis-0-5"
  },
  {
    name: "Full stack -websovelluskehitys: GraphQL",
    courseCode: "CSM14113",
    language: "fi",
    gradeScale: "sis-hyl-hyv"
  },
  {
    name: "Tietorakenteet ja algoritmit II",
    courseCode: "TKT200012",
    language: "fi",
    gradeScale: "sis-0-5"
  },
  {
    name: "Tietorakenteet ja algoritmit I",
    courseCode: "TKT200011",
    language: "fi",
    gradeScale: "sis-0-5"
  },
  {
    name: "Avoin yo: Tietokoneen toiminnan perusteet",
    courseCode: "AYTKT100051",
    language: "fi",
    gradeScale: "sis-hyl-hyv"
  }
]

const testUsers = [
  {
    name: "admin",
    employeeId: 1111,
    email: "admin-user-email@helsinki-cypress-test.com",
    isGrader: false,
    isAdmin: true,
    uid: "admin"
  },
  {
    name: "grader",
    employeeId: 2222,
    email: "grader-user-email@helsinki-cypress-test.com",
    isGrader: true,
    isAdmin: false,
    uid: "grader"
  },
  {
    name: "regular",
    employeeId: 3333,
    email: "regular-user-email@helsinki-cypress-test.com",
    isGrader: false,
    isAdmin: false,
    uid: "regular"
  }
]

const testCompletions = [
  {
    courseCode: testCourses[0].courseCode,
    graderName: testUsers[0].name
  },
  {
    courseCode: testCourses[1].courseCode,
    graderName: testUsers[1].name
  },
  {
    courseCode: testCourses[2].courseCode,
    graderName: testUsers[0].name
  },
  {
    courseCode: testCourses[3].courseCode,
    graderName: testUsers[1].name
  },
  {
    courseCode: testCourses[4].courseCode,
    graderName: testUsers[0].name
  },
  {
    courseCode: testCourses[5].courseCode,
    graderName: testUsers[1].name
  },
  {
    courseCode: testCourses[6].courseCode,
    graderName: testUsers[0].name
  },
  {
    courseCode: testCourses[7].courseCode,
    graderName: testUsers[1].name
  }
]

const testRawEntries0to5 = [
  {
    studentNumber: "011111111",
    grade: 1
  },
  {
    studentNumber: "022222222",
    grade: 2
  },
  {
    studentNumber: "033333333",
    grade: 3
  },
  {
    studentNumber: "044444444",
    grade: 4
  },
  {
    studentNumber: "055555555",
    grade: 5
  }
]

const testRawEntriesHylHyv = [
  {
    studentNumber: "011111111",
    grade: "Hyl."
  },
  {
    studentNumber: "022222222",
    grade: "Hyv."
  },
  {
    studentNumber: "033333333",
    grade: "Hyl."
  },
  {
    studentNumber: "044444444",
    grade: "Hyv."
  },
  {
    studentNumber: "055555555",
    grade: "Hyl."
  }
]

module.exports = {
  gradeScales,
  inProduction,
  inDevelopment,
  inTest,
  getBatchId,
  testCourses,
  testUsers,
  testCompletions,
  testRawEntries0to5,
  testRawEntriesHylHyv
}
