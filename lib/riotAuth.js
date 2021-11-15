var models = require('../models');

async function riotAuth(req, res, next) {
    if(req.headers['device-id'] == null){
        return res.json({"status":"fail", "reason":"Not Authenticated"});
    }

    var auth = await models.Authentications.findByPk(req.headers['device-id']);
    
    if(auth != null && auth.status && auth.deviceSecret == req.headers['device-secret']) {
        req.auth = auth;

        return next();
    } else {
        return res.json({"status":"fail", "reason":"Not Authenticated"});
    }    
}

module.exports.riotAuth = riotAuth