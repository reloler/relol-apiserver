var express = require('express');
var router = express.Router();
var models = require('../models');
var sequelize = require('sequelize');
var request = require('request-promise-native');
var riot = require('../config/riot.json');
var apicache = require('apicache');
var riotAuth = require('../lib/riotAuth').riotAuth;
var Op = sequelize.Op;
apicache.options({
    headers: {
        'cache-control':  'only-if-cached'
    }
})

router.get('/timeline/:gameId', apicache.middleware('1 week'), async function (req, res, next) {
    try {
        var game = await models.Games.findByPk(req.params.gameId);

        if (game.timelineData != null) {
            var timeline = JSON.stringify(game.timelineData);

            return res.json({
                "status": "success",
                "timeline": timeline,
            });
        } else {
            var options = {
                method: "GET",
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36",
                    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
                    "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
                    "Origin": "https://developer.riotgames.com",
                    "X-Riot-Token": riot.secret_key
                },
            };

            options.uri = "https://kr.api.riotgames.com/lol/match/v4/timelines/by-match/"
                + game.gameId;

            try {
                var response = await request(options);
                var timeline = JSON.parse(response);

                await game.update({
                    timelineData: timeline
                });

                return res.json({
                    "status": "success",
                    "timeline": JSON.stringify(timeline),
                });
            } catch (err) {
                throw err;
            }
        }
    } catch (err) {
        throw err;
    }
});

router.get('/find', riotAuth, apicache.middleware('1 week', null, {
    appendKey: (req, res) => req.auth.accountId,
}), async function (req, res, next) {
    var user = await models.Users.findByPk(req.auth.accountId);

    if (user == null) {
        return res.json({
            "status": "fail",
            "reason": "Not Authenticated"
        });
    }

    if (user.gameList == null || user.gameList.length == 0) {
        return res.json({
            "status": "fail",
            "reason": "No Data"
        });
    }

    var gameList = await models.Games.findAll({
        where: {
            gameId: {
                [Op.in]: user.gameList.map(a => a.gameId),
            }
        },
    });

    return res.json({
        "status": "success",
        "gameList": JSON.stringify(gameList),
        "roleList": JSON.stringify(user.gameList),
        "renewAt": user.renewAt
    });
});

router.post('/update', riotAuth, async function (req, res, next) {
    try {
        var user = await models.Users.findByPk(req.auth.accountId);
    } catch (err) {
        throw err;
    }

    if(user.renewAt > new Date().getTime() - 60000) {
        return res.json({
            "status": "limit",
            "renewAt": user.renewAt,
        });
    }

    var options = {
        method: "GET",
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36",
            "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
            "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
            "Origin": "https://developer.riotgames.com",
            "X-Riot-Token": riot.secret_key
        },
    };

    if (user.gameList == null || user.gameList.length == 0) {
        var recentPatch = await models.HashMaps.findByPk("recentPatch");

        options.uri = "https://kr.api.riotgames.com/lol/match/v4/matchlists/by-account/"
            + req.auth.accountId
            + "?beginTime=" + recentPatch.value;

        try {
            var response = await request(options);
            var gameList = JSON.parse(response).matches;

            await user.update({
                gameList: gameList
            });

            apicache.clear('/game/find$$appendKey='+req.auth.accountId);
        } catch (err) { // 갱신할 것이 없을 때
            await user.update({
                renewAt: new Date().getTime()
            });
            return res.json({ "status": "fail", "reason": "no game" });
        }
    } else {
        var timestamp = user.gameList[0].timestamp + 1
        var recentPatch = await models.HashMaps.findByPk("recentPatch");

        options.uri = "https://kr.api.riotgames.com/lol/match/v4/matchlists/by-account/"
            + req.auth.accountId
            + "?beginTime=" + (timestamp > recentPatch.value ? timestamp : recentPatch.value);

        try {
            var response = await request(options);
            var gameList = JSON.parse(response).matches;

            for (var game of user.gameList) {
                if (game.timestamp >= recentPatch.value) {
                    gameList.push(game);
                }
            }

            await user.update({
                gameList: gameList
            });

            apicache.clear('/game/find$$appendKey='+req.auth.accountId);
        } catch (err) { // 갱신할 것이 없을 때
            var gameList = [];

            for (var game of user.gameList) {
                if (game.timestamp >= recentPatch.value) {
                    gameList.push(game);
                }
            }

            if (user.gameList.length != gameList.length) {
                await user.update({
                    renewAt: new Date().getTime(),
                    gameList: gameList
                });

                return res.json({ "status": "success" });
            } else {
                await user.update({
                    renewAt: new Date().getTime()
                });

                return res.json({ "status": "fail", "reason": "no game" });
            }
        }
    }

    var promises = [];

    for (var game of gameList) {
        if (await models.Games.findByPk(game.gameId)) {
            continue;
        }

        options.uri = "https://kr.api.riotgames.com/lol/match/v4/matches/"
            + game.gameId;

        promises.push(request(options));
    }

    var gameDataList = []

    while (true) {
        var remain = [];

        await Promise.allSettled(promises).then((results) => {
            results.forEach((result) => {
                if (result.status == 'rejected') {
                    options.uri = result.reason.options.uri;
                    remain.push(request(options));
                } else {
                    var gameData = JSON.parse(result.value);

                    gameDataList.push({
                        gameId: gameData.gameId,
                        gameData: gameData,
                        timestamp: gameData.gameCreation,
                    });
                }
            })
        });

        if (remain.length != 0) {
            promises = remain;
            await sleep(1000);
        } else {
            break;
        }
    }

    await models.Games.bulkCreate(gameDataList);
    await user.update({
        renewAt: new Date().getTime()
    });

    apicache.clear('/game/find$$appendKey='+req.auth.accountId);

    return res.json({ "status": "success" });
});

const sleep = (ms) => {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

module.exports = router;