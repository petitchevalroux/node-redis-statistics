"use strict";
var path = require("path"),
    redis = require("redis-mock"),
    sinon = require("sinon"),
    assert = require("assert"),
    client = redis.createClient(),
    RedisStatistics = require(path.join(__dirname, "..")),
    redisStatistics = new RedisStatistics(client),
    toRestore = [];



afterEach(function() {
    toRestore.forEach(function(element) {
        element.restore();
    });
});

describe("zPercentile", function() {

    describe("working", function() {
        var testSet = [];
        beforeEach(function() {
            toRestore.push(sinon.stub(redisStatistics.client,
                "zcard",
                function(key, cb) {
                    cb(null, testSet.length);
                }));

            toRestore.push(sinon.stub(redisStatistics.client,
                "zrange",
                function(key, start, stop, opt,
                    cb) {
                    var results = [];
                    testSet
                        .slice(start, stop + 1)
                        .forEach(function(e) {
                            results.push(e);
                            results.push(e);
                        });
                    cb(null, results);
                }));

            toRestore.push(sinon.stub(redisStatistics.client,
                "zrevrange",
                function(key, start, stop, opt,
                    cb) {
                    var results = [];
                    var reverse = JSON.parse(
                        JSON.stringify(
                            testSet));
                    reverse.reverse();
                    reverse
                        .slice(start, stop + 1)
                        .forEach(function(e) {
                            results.push(e);
                            results.push(e);
                        });
                    cb(null, results);
                }));
        });

        it(
            "should compute 50 percentile (median) on odd card set",
            function() {
                testSet = [43, 54, 56, 61, 62, 66, 68, 69,
                    69, 70, 71,
                    72, 77, 78, 79, 85, 87, 88, 89, 93,
                    95, 96, 98,
                    99, 99
                ];

                return redisStatistics
                    .zPercentile("zset", 50)
                    .then(function(percentile) {
                        assert.strictEqual(percentile,
                            77);
                        return percentile;
                    });
            });

        it(
            "should compute 50 percentile (median) on even card set",
            function() {
                testSet = [43, 54, 56, 61, 62, 66, 68, 69,
                    69, 70, 71,
                    72, 77, 78, 79, 85, 87, 88, 89, 93,
                    95, 96, 98,
                    99
                ];

                return redisStatistics
                    .zPercentile("zset", 50)
                    .then(function(percentile) {
                        assert.strictEqual(percentile,
                            74.5);
                        return percentile;
                    });
            });

        it("should compute 25 percentile on odd card set",
            function() {
                testSet = [43, 54, 56, 61, 62, 66, 68, 69,
                    69, 70, 71,
                    72, 77, 78, 79, 85, 87, 88, 89, 93,
                    95, 96, 98,
                    99, 99
                ];
                return redisStatistics
                    .zPercentile("zset", 25)
                    .then(function(percentile) {
                        assert.strictEqual(percentile,
                            68);
                        return percentile;
                    });
            });

        it("should compute 25 percentile on even card set",
            function() {
                testSet = [43, 54, 56, 61, 62, 66, 68, 69,
                    69, 70, 71,
                    72, 77, 78, 79, 85, 87, 88, 89, 93,
                    95, 96, 98,
                    99
                ];
                return redisStatistics
                    .zPercentile("zset", 25)
                    .then(function(percentile) {
                        assert.strictEqual(percentile,
                            67);
                        return percentile;
                    });
            });

        it("should compute 75 percentile on odd card set",
            function() {
                testSet = [66, 68, 69, 83, 97, 142, 155];
                return redisStatistics
                    .zPercentile("zset", 75)
                    .then(function(percentile) {
                        assert.strictEqual(percentile,
                            142);
                        return percentile;
                    });
            });

        it("should compute 75 percentile on even card set",
            function() {
                testSet = [66, 68, 69, 83, 97, 901, 1237,
                    2701
                ];
                return redisStatistics
                    .zPercentile("zset", 75)
                    .then(function(percentile) {
                        assert.strictEqual(percentile,
                            1069);
                        return percentile;
                    });
            });

        it("should compute 0 percentile on even card set",
            function() {
                testSet = [66, 68, 69, 83, 97, 901, 1237,
                    2701
                ];
                return redisStatistics
                    .zPercentile("zset", 0)
                    .then(function(percentile) {
                        assert.strictEqual(percentile,
                            66);
                        return percentile;
                    });
            });

        it("should compute 100 percentile on even card set",
            function() {
                testSet = [66, 68, 69, 83, 97, 142, 155];
                return redisStatistics
                    .zPercentile("zset", 100)
                    .then(function(percentile) {
                        assert.strictEqual(percentile,
                            155);
                        return percentile;
                    });
            });
    });

    describe("errors", function() {
        it(
            "raise an error when redis client failed when fetching range",
            function(done) {
                toRestore.push(sinon.stub(redisStatistics.client,
                    "zrevrange",
                    function(key, start, stop, opts,
                        cb) {
                        cb(new Error(
                            "Redis client error"
                        ));
                    }));

                redisStatistics
                    .zPercentile("zset", 100)
                    .catch(function(err) {
                        assert.strictEqual(err.message,
                            "Error: Redis client error"
                        );
                        done();
                    });
            });

        it(
            "raise and error when card is odd and range cmd does not return the right count",
            function(done) {
                toRestore.push(sinon.stub(redisStatistics.client,
                    "zcard",
                    function(key, cb) {
                        cb(null, 3);
                    }));
                toRestore.push(sinon.stub(redisStatistics.client,
                    "zrevrange",
                    function(key, start, stop, opts,
                        cb) {
                        cb(null, []);
                    }));
                redisStatistics
                    .zPercentile("zset", 100)
                    .catch(function(err) {
                        assert.strictEqual(err.message,
                            "invalid response when getting percentile : []"
                        );
                        done();
                    });
            });

        it(
            "raise and error when card is even and range cmd does not return the right count",
            function(done) {
                toRestore.push(sinon.stub(redisStatistics.client,
                    "zcard",
                    function(key, cb) {
                        cb(null, 6);
                    }));
                toRestore.push(sinon.stub(redisStatistics.client,
                    "zrevrange",
                    function(key, start, stop, opts,
                        cb) {
                        cb(null, []);
                    }));
                redisStatistics
                    .zPercentile("zset", 100)
                    .catch(function(err) {
                        assert.strictEqual(err.message,
                            "invalid response when getting percentile : []"
                        );
                        done();
                    });
            });
    });

});
