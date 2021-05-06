'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addConstraint('entries', {
            fields: ['rawEntryId'],
            type: 'unique'
        })
    },
    down: (queryInterface, Sequelize) => { }
};
