const redisObject = require('redis');
const bluebird = require('bluebird');
const moment = require('moment');
bluebird.promisifyAll(redisObject.RedisClient.prototype);
bluebird.promisifyAll(redisObject.Multi.prototype);
const redis = redisObject.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);
if (process.env.REDIS_PASSWORD)
    redis.auth(process.env.REDIS_PASSWORD);
redis.on("connect", function () {
    console.log('Redis Connected');
});
redis.on("Error", function (err) {
    console.log(err);
});



module.exports = {

	


}