# redis-statistics
Redis statistics utility library

## Available statistics 

* Percentile on zSet

Missing some statistics ? Feel free to contribute creating a PR ;)

## Usage

### Instanciation
```javascript
var redis = require("redis");
var RedisStatistics = require("redis-statistics");
var stats = new RedisStatistics(redis.createClient());
```

### Percentile
```javascript
stats
    .zPercentile("zset-key", 50)
    .then(function(percentile){
        console.log("median is: ", percentile);
    }}
    .catch(function(err){
        console.log("an error occured", err);
    }};
```

[More examples](https://github.com/petitchevalroux/node-redis-statistics/blob/master/examples/percentile.js)
