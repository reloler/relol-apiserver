var express = require('express');
var router = express.Router();
var models = require('../models');
var sequelize = require('sequelize');
var googleConfig = require('../config/google.json');
var Op = sequelize.Op;
var {google} = require('googleapis');
var googleAuth = require('../lib/googleAuth').googleAuth;
var oAuth2Client = new google.auth.OAuth2(
    googleConfig.clientId,
    googleConfig.clientSecret,
    ""
);

router.post('/signOut/:accountId', async function(req, res, next) {
    if(req.session.accountId == req.params.accountId) {
        req.session.destroy(function(err){
            if(err) throw err;

            return res.json({
                "status": "success",
            });
        });
    }
});

router.post('/signIn/:accountId', async function(req, res, next) {
    try {
        var account = await models.Accounts.findByPk(req.params.accountId);

        if (account == null) {
            var {tokens} = await oAuth2Client.getToken(req.body.code);

            if(tokens.refresh_token != null) {
                await models.Accounts.create({
                    accountId: req.params.accountId,
                    refreshToken: tokens.refresh_token,
                    accessToken: tokens.access_token,
                });
            }

            if(tokens.access_token != null) {
                req.session.accountId = req.params.accountId;
                req.session.save(function() {
                    return res.json({"status": "success"});
                });
            }
        } else {
            var {tokens} = await oAuth2Client.getToken(req.body.code);

            if(tokens.refresh_token != null) {
                await account.update({
                    refreshToken: tokens.refresh_token,
                    accessToken: tokens.access_token,
                });
            }

            if(tokens.access_token != null) {
                req.session.accountId = req.params.accountId;
                req.session.save(function() {
                    return res.json({"status": "success"});
                });
            }
        }
    } catch(err){
        res.json({"status": "fail"});
        throw err;
    }
});

router.post('/setMessageToken/:accountId', googleAuth, async function(req, res, next) {
    try {
        var account = await models.Accounts.findByPk(req.params.accountId);

        if(account == null) {
            return res.json({"status": "fail", "reason": "not user"});
        } else {
            await account.update({
                messageToken: req.body.messageToken,
            });

            return res.json({"status":"success"});
        }
    } catch(err) {
        throw err;
    }
});

module.exports = router;
