var models = require('../models');

async function googleAuth(req, res, next) {
    if(req.session.accountId != null) {
        return next();
    } else {
        return res.json({"status":"fail", "reason":"Not Authenticated"});
    }
}

module.exports.googleAuth = googleAuth