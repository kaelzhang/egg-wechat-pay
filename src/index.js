const {Payment} = require('wechat-pay')
const delegates = require('delegates')
const moment = require('moment')
const {defaults, BASIC_TYPES} = require('skema')
const {shape} = defaults({
  types: BASIC_TYPES.STRICT
})

const MockData = shape({
  nonce_str: {
    default (self) {
      return self._payment._generateNonceStr()
    }
  },

  sign_type: {
    optional: true,
    validate (v) {
      return v === 'MD5' || v === 'HMAC-SHA256'
    }
  },

  result_code: {
    default: 'SUCCESS'
  },

  appid: {
    set (self) {
      return self._config.appId
    }
  },

  mch_id: {
    set (self) {
      return self._config.mchId
    }
  },

  openid: {
    default: 'wxd930ea5d5a258f4f'
  },

  trade_type: {
    default: 'JSAPI'
  },

  bank_type: {
    default: 'CMC'
  },

  total_fee: Number,
  cash_fee: Number,
  settlement_total_fee: {
    optional: true,
    type: Number
  },
  fee_type: {
    default: 'CNY',
    type: String
  },
  transaction_id: String,
  out_trade_no: String,
  attach: {
    optional: true,
    type: String
  },
  time_end: {
    default () {
      return new Date
    },
    set (v) {
      const date = v instanceof Date
        ? date
        : new Date(date)

      return moment(date).format('YYYYMMDDHHmmss')
    }
  }
})

class WechatPayBase {
  constructor ({
    bodyPrefix,
    config
  }) {
    this._bodyPrefix = bodyPrefix
    this._config = config
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

  mock (data) {
    const mocked = MockData.from(data, [this])
    mocked.sign = this._payment._getSign(mocked)
    return this.stringify(mocked)
  }

  _handleBody (body) {
    const prefix = this._bodyPrefix
    if (!prefix) {
      return body
    }

    if (body.indexOf(prefix) === 0) {
      return body
    }

    return `${prefix}-${body}`
  }
}

delegates(WechatPayBase.prototype, '_payment')
.method('refund')
.method('refundQuery')
.method('closeOrder')
.method('orderQuery')
.method('sendRedPacket')
.method('redPacketQuery')
.method('transfers')
.method('downloadBill')

class WechatPayNew extends WechatPayBase {
  constructor (payment, options) {
    super(options)
    this._payment = payment
  }
}

module.exports = class WechatPayManager extends WechatPayBase {
  constructor ({
    secret, partnerKey,
    appId,
    merchantId, mchId,
    notifyUrl,
    pfx,
    bodyPrefix
  }) {
    const config = {
      partnerKey: secret || partnerKey,
      mchId: merchantId || mchId,
      notifyUrl,
      pfx,
      appId
    }

    super({bodyPrefix, config})

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

    return new WechatPayNew(this._newApp(appId), this._config)
  }
}
