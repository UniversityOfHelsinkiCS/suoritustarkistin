'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      we can seed the old list through here
    */
    return queryInterface.bulkInsert('Credits', [{
        studentId: '987654321',
        courseId: 'AYTKT21018',
        isInOodikone: false,
        createdAt: Sequelize.fn('NOW'),
        updatedAt: Sequelize.fn('NOW')
      }], {});
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.bulkDelete('Credits', null, {});
  }
};
