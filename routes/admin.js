var express = require('express');
var router = express.Router();
var models = require('../models');

router.get('/push/:key/:value', async function(req, res, next) {
    try {
        await models.HashMaps.create({
            key: req.params.key,
            value: req.params.value,
        });
    } catch(err) {
        throw err;
    }

    return res.json({"status": "success"});
});

router.get('/update', async function(req, res, next){ 
    var games = await models.Games.findAll()

    for(var game of games) {
        var gameJson = game.gameData

        await game.update({
            timestamp: gameJson.gameCreation,
        });
    }

    return res.json({"status":"success"});
})

router.get('/update/:key/:value', async function(req, res, next){
    try {
        await models.HashMaps.update({value: req.params.value}, {where: {key: req.params.key}});
    } catch(err) {
        throw err;
    }

    return res.json({"status": "success"});
});

module.exports = router;
