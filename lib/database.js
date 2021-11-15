var models = require('../models/index');

async function load() {
    try {
        await models.sequelize.sync(
                //{force:true}
            );
    } catch(err) {
        console.log(err);
        
        return;
    }
}

module.exports.load = load;