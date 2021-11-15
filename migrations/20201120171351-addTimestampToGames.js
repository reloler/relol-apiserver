'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("Games", "timestamp", {
      type: Sequelize.BIGINT,
      allowNull: false,
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("Games", "timestamp")
  }
};

