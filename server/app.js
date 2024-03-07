const Koa = require('koa');
const Router = require('koa-router');
const config = require('config');
const WechatAPI = require('./utils/wechat-api-hub').wechat;
const cors = require('@koa/cors');

const app = new Koa();
const router = new Router();

// 捕获程序运行中不确定的异常
app.on('error', (err) => {
  console.error('app error:', err)
});

process.on('unhandledRejection', reason => {
  console.error('unhandledRejection:', reason)
});

const allowedOrigins = [
  'http://localhost:3112',
  // 配置跨域白名单
]

app.use(cors({
  origin(ctx) {
    const requestOrigin = ctx.get('Origin');

    return allowedOrigins.includes(requestOrigin) ? requestOrigin : false;
  },
}));

router.get('/api/jsconfig', async (ctx) => {
  // if (config.get('envCode') !== 'prod') {
  //   ctx.response.type = 'application/json';
  //   ctx.body = {
  //     data: null,
  //     msg: '非生产环境不允许调用',
  //   };
  //
  //   return
  // }

  const url = decodeURIComponent(ctx.request.query.url);

  const result = await new Promise(function (resolve, reject) {
    WechatAPI.getJsConfig({ url }, function (err, jsConfig) {
      if (err) {
        return reject(err);
      }

      resolve({
        ...jsConfig,
        debug: false,
        jsApiList: [
          'onMenuShareTimeline',
          'onMenuShareAppMessage',
          'updateAppMessageShareData',
          'updateTimelineShareData',
        ]
      })
    })
  })

  ctx.response.type = 'application/json';
  // 设置响应体为 JSON 数据
  ctx.body = {
    data: result,
  };
});

router.get('/api', (ctx) => {
  const url = ctx.protocol + '://' + ctx.host + ctx.originalUrl;
  ctx.response.type = 'application/json';

  // 设置响应体为 JSON 数据
  ctx.body = {
    data: {
      url,
      envCode: config.get('envCode'),
      request: {
        method: ctx.request.method,
        originalUrl: ctx.request.originalUrl,
        url: ctx.request.url,
        path: ctx.request.path,
        header: ctx.request.header,
      },
    },
  };
});

router.get('/', (ctx) => {
  ctx.response.body = 'Hello World';
});

// 使用路由中间件
app.use(router.routes()).use(router.allowedMethods());

const port = config.get('port');
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
