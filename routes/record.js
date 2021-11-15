var express = require('express');
var router = express.Router();
var models = require('../models');
var sequelize = require('sequelize');
var googleAuth = require('../lib/googleAuth').googleAuth;
var serviceAccount = require("../config/serviceAccountKey.json");
var admin = require("firebase-admin");
var Op = sequelize.Op;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://relol-288402.firebaseio.com"
});

router.post('/done/:recordId', async function(req, res, next){
    var record = await models.Records.findByPk(req.params.recordId);
    var account = await models.Accounts.findByPk(record.recordOwner);

    var payload = {
        notification: {
            title: "하이라이트 녹화 완료",
            body: "드라이브에 녹화된 영상이 업로드되었습니다.",
        }
    }

    admin.messaging().sendToDevice(account.messageToken, payload);

    return res.json({"status":"success"});
});

router.get('/find', async function(req, res, next) {
    var record = await models.Records.findOne({
        where: {
            gameId: req.query.gameId,
            playerId: req.query.playerId,
            recordOwner: req.query.accountId,
        }
    });

    if(record == null) {
        return res.json({"status": "none"});
    } else if (record.recordStatus == 0 || record.recordStatus == 1) {
        return res.json({"status": "pending"});
    } else {
        return res.json({"status": "done"});
    }
});

router.post('/register', googleAuth, async function (req, res, next) {
    var account = await models.Accounts.findByPk(req.session.accountId);

    if(account == null) {
        return res.json({
            "status": "fail",
            "reason": "Not Authenticated",
        });
    } else if(account.point < 100) {
        return res.json({
            "status": "fail",
            "reason": "Not Enough Point",
        });
    }

    var recordData = JSON.parse(req.body.recordData);

    await models.Records.create({
        recordData: recordData,
        recordOwner: req.body.accountId,
        gameId: recordData.gameId,
        playerId: recordData.playerId,
    });

    return res.json({"status" : "success"});
});

module.exports = router;