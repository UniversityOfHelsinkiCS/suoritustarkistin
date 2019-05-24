'use strict'

const fs = require('fs')

module.exports = {
  up: (queryInterface, Sequelize) => {
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
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('credits', null, {})
  }
}
