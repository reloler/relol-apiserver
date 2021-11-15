'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("Games", "timelineData", {
      type: Sequelize.JSON,
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("Games", "timelineData")
  }
};
