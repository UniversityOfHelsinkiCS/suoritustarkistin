'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addConstraint('users', {
            fields: ['uid'],
            type: 'unique'
        })
        await queryInterface.changeColumn('users', 'uid', {
          type: Sequelize.STRING,
          allowNull: false
        })
    },
    down: (queryInterface, Sequelize) => { }
};
