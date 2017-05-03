"use strict";
var redis = require("redis"),
    path = require("path"),
    client = redis.createClient(),
    RedisStatistics = require(path.join(__dirname, "..")),
    redisStatistics = new RedisStatistics(client),
    rKey = "percentile",
    Promise = require("bluebird");

client
    .multi()
    .del(rKey)
    .zadd([rKey, 27, "1", 1, "2", 77, "3", 81, "4", 133, "5", 51, "6", 86, "7", 21, "8", 45, "9", 27, "10"])
    .exec(
    function (err, response) {
        Promise.all(
            [
                redisStatistics.zPercentile(rKey, 0),
                redisStatistics.zPercentile(rKey, 25),
                redisStatistics.zPercentile(rKey, 50),
                redisStatistics.zPercentile(rKey, 75),
                redisStatistics.zPercentile(rKey, 100)
            ]
        )
        .then(function (responses) {
            console.log(
                "min: ", responses[0],
                "first quartile: ", responses[1],
                "median: ", responses[2],
                "third quartile: ", responses[3],
                "max: ", responses[4]
            );
            client.quit();
        });
    });