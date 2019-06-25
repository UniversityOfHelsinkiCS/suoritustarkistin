'use strict'

const fs = require('fs')

module.exports = {
  up: (queryInterface, Sequelize) => {
    if (fs.existsSync('sids.txt')) {
      const rawData = fs.readFileSync('sids.txt', 'utf8')
      const oldList = rawData.split('\n').map((sid) => ({
        studentId: sid,
        courseId: 'AYTKT21018',
        moocId: -1,
        isInOodikone: false,
        createdAt: Sequelize.fn('NOW'),
        updatedAt: Sequelize.fn('NOW'),
        reportId: 1
      }))
      console.log('# of entries', oldList.length)
      return queryInterface.bulkInsert('credits', oldList, {})
    } else {
      const mockList = [
        {
          studentId: '010000003',
          courseId: 'AYTKT21018',
          moocId: 1,
          isInOodikone: false,
          createdAt: Sequelize.fn('NOW'),
          updatedAt: Sequelize.fn('NOW'),
          reportId: 1
        },
        {
          studentId: '011000002',
          courseId: 'AYTKT21018',
          moocId: 2,
          isInOodikone: false,
          createdAt: Sequelize.fn('NOW'),
          updatedAt: Sequelize.fn('NOW'),
          reportId: 1
        },
        {
          studentId: '011100009',
          courseId: 'AYTKT21018',
          moocId: 3,
          isInOodikone: false,
          createdAt: Sequelize.fn('NOW'),
          updatedAt: Sequelize.fn('NOW'),
          reportId: 1
        }
      ]
      return queryInterface.bulkInsert('credits', mockList, {})
    }
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('credits', null, {})
  }
}
