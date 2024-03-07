const Redis = require('ioredis');
const config = require('config');

const redis = new Redis({
  host: config.get('redis.host'),
  port: config.get('redis.port'),
  password: config.get('redis.password'),
  db: config.get('redis.db'),
});

redis.on('error', (err) => {
  console.log('Redis error', err);
});

module.exports = redis;
