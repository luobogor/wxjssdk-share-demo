const config = require('config');
const WechatAPI = require('wechat-api');
const Redis = require('./redis');
const Helper = require('./helper');

function getWechatKey(type) {
  return 'NODE_WECHAT_' + (type || 'DEFAULT_TYPE').toUpperCase();
}

const TOKEN_KEY = getWechatKey('TOKEN')

/**
 * 将存储在 Redis 的原始信息，解析为 JSON，并在本地将到期时间随机提前，避免各节点同时到期、同时刷新
 *
 * @param {String} rawData - 原始数据
 * @return {Object}
 */
function parseRawData(rawData) {
  const data = Helper.parseJSON(rawData)
  if (!data) {
    return data
  }

  return {
    ...data,
    // 因为 wechat-api 内部已经提前 10 秒，所以此处最多提前 50 秒，合计最多提前 1 分钟
    expireTime: data.expireTime - Math.round(Math.random() * 50 * 1000),
  }
}

const wechat = new WechatAPI(
  config.get('wechat.id'),
  config.get('wechat.secret'),
  function getToken(callback) {
    Redis.get(TOKEN_KEY, function (err, rawData) {
      const data = parseRawData(rawData)

      if (err) {
        console.error('Redis.get:', err)
      }

      console.log('wechat redis get token', JSON.stringify({
        appId: config.get('wechat.id'),
        redisHost: config.get('redis.host'),
        redisDb: config.get('redis.db'),
        redisKey: TOKEN_KEY,
        data,
      }));

      callback(err, data)
    });
  },
  function saveToken(token, callback) {
    console.log('wechat redis set token', JSON.stringify({
      appId: config.get('wechat.id'),
      redisHost: config.get('redis.host'),
      redisDb: config.get('redis.db'),
      redisKey: TOKEN_KEY,
      token,
    }))

    Redis.set(TOKEN_KEY, JSON.stringify(token), 'EX', 7200, callback);
  }
);

wechat.registerTicketHandle(
  function getTicket(type, callback) {
    Redis.get(getWechatKey(type), function (err, rawData) {
      const data = parseRawData(rawData)

      console.log('wechat redis get ticket', JSON.stringify({
        appId: config.get('wechat.id'),
        redisHost: config.get('redis.host'),
        redisDb: config.get('redis.db'),
        redisKey: getWechatKey(type),
        data,
      }))

      callback(err, data)
    });
  },
  function saveTicket(type, ticket, callback) {
    console.log('wechat redis set ticket', JSON.stringify({
      appId: config.get('wechat.id'),
      redisHost: config.get('redis.host'),
      redisDb: config.get('redis.db'),
      redisKey: getWechatKey(type),
      ticket,
    }))

    Redis.set(getWechatKey(type), JSON.stringify(ticket), 'EX', 7200, callback);
  }
);


module.exports = {
  wechat,
};
