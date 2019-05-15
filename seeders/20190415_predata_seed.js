'use strict';

const fs = require('fs')

module.exports = {
  up: (queryInterface, Sequelize) => {
    console.log('what')
    const rawData = fs.readFileSync("sids.txt", 'utf8')
    const oldList = rawData.split('\n').map((sid) => ({
        student_id: sid,
        course_id: 'AYTKT21018',
        mooc_id: -1,
        is_in_oodikone: false,
        created_at: Sequelize.fn('NOW'),
        updated_at: Sequelize.fn('NOW')
        }))
    console.log('# of entries ', oldList.length)
    return queryInterface.bulkInsert('credits', oldList, {});
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.bulkDelete('credits', null, {});
  }
};
