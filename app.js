const {Payment} = require('wechat-pay')

function create (config = {}, app) {
  return new WechatPayManager(config)
}

class WechatPayBase {
  constructor (options = {}) {
    this._options = options
  }

  requestPayment ({
    body,
    spbill_create_ip,
    ip,
    ...others
  }) {
    return this._payment.getBrandWCPayRequestParams({
      body: this._handleBody(body),
      spbill_create_ip: ip || spbill_create_ip,
      ...others
    })
  }

  parse (xml) {
    return this._payment.validate(xml)
  }

  stringify (obj) {
    return this._payment.buildXml(obj)
  }

  fail (ctx, return_msg) {
    ctx.body = this.stringify({
      return_code: 'FAIL',
      return_msg
    })
  }

  success (ctx) {
    ctx.body = this.stringify({
      return_code: 'SUCCESS'
    })
  }

  _handleBody (body) {
    const prefix = this._options.bodyPrefix
    if (!prefix) {
      return body
    }

    if (body.indexOf(prefix) === 0) {
      return body
    }

    return `${prefix}-${body}`
  }
}

class WechatPayNew extends WechatPayBase {
  constructor (payment, options) {
    super(options)
    this._payment = payment
  }
}

class WechatPayManager extends WechatPayBase {
  constructor ({
    secret, partnerKey,
    appId,
    merchantId, mchId,
    notifyUrl,
    pfx,
    bodyPrefix
  }) {
    super({bodyPrefix})

    this._config = {
      partnerKey: secret || partnerKey,
      mchId: merchantId || mchId,
      notifyUrl,
      pfx
    }

    this._appId = appId
    this._apps = Object.create(null)
    this._payment = this._newApp(appId)
  }

  _newApp (appId) {
    const app = this._apps[appId]
    if (app) {
      return app
    }

    const config = Object.assign({}, this._config, {appId})
    return this._apps[appId] = new Payment(config)
  }

  // Creates a new instance
  newApp (appId) {
    if (appId === this._appId) {
      return this
    }

    return new WechatPayNew(this._newApp(appId), this._options)
  }
}

module.exports = app => {
  app.addSingleton('wechatPay', create)
}
