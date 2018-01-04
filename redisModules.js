const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL || {host:'localhost', port: 6379});



exports.chkIfCached = function(key){
    return new Promise (function(resolve, reject){
        client.get(key, function(err, data){
            if (err){
                reject(err);
            } else {
                // console.log('we got data from chkIfCached', data);
                resolve(data);
            }
        });
    });
};


exports.setCache = function(key, value){
    return new Promise (function(resolve, reject){
        client.setex(key, 60 ,value, function(err, data){
            if (err){
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};


exports.delCache = function(key){
    return new Promise (function(resolve, reject){
        client.del(key, function(err, data){
            if (err){
                reject(err);
            } else {
                console.log('cache deleted');
                resolve(data);
            }
        });
    });
};
