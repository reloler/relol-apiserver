var express = require('express');
var router = express.Router();
var models = require('../models');
var sequelize = require('sequelize');
var request = require('request-promise-native');
var riot = require('../config/riot.json');
var { v4: uuidv4 } = require('uuid');
var apicache = require('apicache');

router.get('/find', apicache.middleware('1 day', null, {
    appendKey: (req, res) => req.headers["device-id"],
}), async function (req, res, next) {
    try {
        var auth = await models.Authentications.findByPk(req.headers["device-id"]);
        console.log(auth);
    } catch (err) {
        throw err;
    }

    if (auth != null && auth.status == true && auth.deviceSecret == req.headers['device-secret']) {
        var user = await models.Users.findByPk(auth.accountId);
        console.log(user);

        var options = {
            uri: "https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-account/" + auth.accountId,
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36",
                "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
                "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
                "Origin": "https://developer.riotgames.com",
                "X-Riot-Token": riot.secret_key
            },
        };

        try {
            var response = await request(options);
        } catch(err){
            console.log(err);

            throw err;
        }

        response = JSON.parse(response);
        
        user = await user.update({
            icon: response.profileIconId,
            nickname: response.name,
        });

        user = JSON.stringify(user);
    } else {
        var user = null;
    }

    return res.json({
        "status": "success",
        "user": user
    });
});

router.post('/unregister', async function (req, res, next) {
    try {
        await models.Authentications.destroy({
            where: {
                deviceId: req.headers['device-id'],
                deviceSecret: req.headers['device-secret'],
            }
        });

        return res.json({ "status": "success" });
    } catch (err) {
        throw err;
    }
})

router.post('/register', async function (req, res, next) {
    try {
        var options = {
            uri: "https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-name/" + encodeURI(req.body.nickname),
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36",
                "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
                "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
                "Origin": "https://developer.riotgames.com",
                "X-Riot-Token": riot.secret_key
            },
        };

        try {
            var response = await request(options);
        } catch (err) {
            return res.json({
                "status": "fail",
                "reason": "Riot Account Not Found"
            });
        }

        response = JSON.parse(response);

        var auth = await models.Authentications.findByPk(req.headers['device-id']);
        var icon = getRandomIcon(Number(response.profileIconId));

        if (auth != null && !auth.status) {
            auth.update({
                accountId: response.accountId,
            });
        } else {
            await models.Authentications.create({
                deviceId: req.headers['device-id'],
                status: false,
                accountId: response.accountId,
            });
        }

        var user = await models.Users.findByPk(response.accountId);

        if(user != null) {
            user.update({
                nickname: response.name,
                icon: icon,
                level: response.summonerLevel,
            });
        } else {
            await models.Users.create({
                accountId: response.accountId,
                nickname: response.name,
                icon: icon,
                level: response.summonerLevel,
            })
        }

        return res.json({
            "status": "success",
            "nickname": response.name,
            "currentProfileIconId": Number(response.profileIconId),
            "verifyProfileIconId": icon,
        })
    } catch (err) {
        throw err;
    }
});


function getRandomIcon(profileIconId) {
    var randomIconId = -1

    do {
        randomIconId = Math.floor(Math.random() * 28)
    } while (randomIconId == profileIconId)

    return randomIconId
}

router.post('/verify', async function (req, res, next) {
    try {
        var auth = await models.Authentications.findByPk(req.headers["device-id"]);
        var user = await models.Users.findByPk(auth.accountId);

        var options = {
            uri: "https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-name/" + encodeURI(user.nickname),
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36",
                "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
                "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
                "Origin": "https://developer.riotgames.com",
                "X-Riot-Token": riot.secret_key
            },
        }

        try {
            var response = await request(options);
        } catch (err) {
            return res.json({
                "status": "fail",
                "reason": "Riot Account Not Found or Riot API Call Limit"
            });
        }

        response = JSON.parse(response);


        if (Number(response.profileIconId) == user.icon) {
            var deviceSecret = uuidv4()

            apicache.clear('/auth/find$$appendKey='+req.headers["device-id"]);

            await auth.update({
                status: true,
                deviceSecret: deviceSecret,
            });
            return res.json({
                "status": "success",
                "deviceSecret": deviceSecret,
            });
        } else {
            return res.json({
                "status": "fail",
                "reason": "Mismatch Icon"
            });
        }
    } catch (err) {
        throw err;
    }
});

module.exports = router;
