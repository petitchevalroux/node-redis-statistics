"use strict";
var Promise = require("bluebird");
var Error = require("@petitchevalroux/error");

function RedisStatistics(client) {
    this.client = client;
}

/**
 * Return zSet cardinality
 * @param {string} key
 * @returns {Promise}
 */
RedisStatistics.prototype.zCard = function(key) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self
            .client
            .zcard(key,
                function(err, card) {
                    if (err) {
                        reject(new Error(err));
                        return;
                    }
                    resolve(parseFloat(card));
                }
            );
    });
};

/**
 * Return the p percentile of a zSet
 * @param  {string} key
 * @param  {number} p
 * @return Promise
 */
RedisStatistics.prototype.zPercentile = function(key, p) {
    var self = this;
    return this
        .getPercentileRangeCmd(key, p)
        .then(function(cmd) {
            return new Promise(function(resolve, reject) {
                self.client[cmd.cmd](
                    key,
                    cmd.range[0],
                    cmd.range[1],
                    "WITHSCORES",
                    function(err, response) {
                        if (err) {
                            reject(new Error(err));
                            return;
                        }
                        if (cmd.range[0] !== cmd.range[1]) {
                            if (response.length !== 4) {
                                reject(new Error(
                                    "invalid response when getting percentile : %j",
                                    response));
                            }
                            resolve((parseFloat(response[1]) +
                                parseFloat(response[
                                    3])) / 2);
                        } else {
                            if (response.length !== 2) {
                                reject(new Error(
                                    "invalid response when getting percentile : %j",
                                    response));
                            }
                            resolve(parseFloat(response[1]));
                        }
                    });
            });
        });
};

/**
 * Return the redis cmd and the range to get percentile
 * @param {string} key
 * @param {number} p
 * @returns {Promise}
 */
RedisStatistics.prototype.getPercentileRangeCmd = function(key, p) {
    var fp = parseFloat(p / 100),
        rangeCmd,
        range;
    if (fp === 0.0) {
        range = [0, 0];
        rangeCmd = "zrange";
    } else if (fp === 1.0) {
        range = [0, 0];
        rangeCmd = "zrevrange";
    } else {
        rangeCmd = "zrange";
        return this
            .zCard(key)
            .then(function(card) {
                var i = card * fp,
                    iFloor = Math.floor(i);
                if (i === iFloor) {
                    range = [i - 1, i];
                } else {
                    range = [iFloor, iFloor];
                }
                return {
                    "cmd": rangeCmd,
                    "range": range
                };
            });
    }
    return Promise.resolve({
        "cmd": rangeCmd,
        "range": range
    });
};

module.exports = RedisStatistics;
