const WechatPayManager = require('./src')

function create (config = {}) {
  return new WechatPayManager(config)
}

module.exports = app => {
  app.addSingleton('wechatPay', create)
}
