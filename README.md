[![Build Status](https://travis-ci.org/kaelzhang/egg-wechat-pay.svg?branch=master)](https://travis-ci.org/kaelzhang/egg-wechat-pay)
[![Coverage](https://codecov.io/gh/kaelzhang/egg-wechat-pay/branch/master/graph/badge.svg)](https://codecov.io/gh/kaelzhang/egg-wechat-pay)
<!-- optional appveyor tst
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/github/kaelzhang/egg-wechat-pay?branch=master&svg=true)](https://ci.appveyor.com/project/kaelzhang/egg-wechat-pay)
-->
<!-- optional npm version
[![NPM version](https://badge.fury.io/js/err-object.svg)](http://badge.fury.io/js/err-object)
-->
<!-- optional npm downloads
[![npm module downloads per month](http://img.shields.io/npm/dm/err-object.svg)](https://www.npmjs.org/package/err-object)
-->
<!-- optional dependency status
[![Dependency Status](https://david-dm.org/kaelzhang/egg-wechat-pay.svg)](https://david-dm.org/kaelzhang/egg-wechat-pay)
-->

# egg-wechat-pay

Wechat pay plugin for egg.

## Install

```sh
$ npm i egg-wechat-pay
```

## Configurations

config/plugin.js

```js
exports.wechatPay = {
  enable: true,
  package: 'egg-wechat-pay'
}
```

config/config.default.js

```js
exports.wechatPay = {
  client: {
    // Optional,
    bodyPrefix: '麦当劳',
    appId,
    merchantId,
    secret,
    notifyUrl,
    pfx: fs.readFileSync(thePathToPFX)
  }
}
```

Then:

```js
...
  async doSomething () {
    const params = await this.app.wechatPay.requestPayment(order)
    // {
    //   "appId": "wx...",
    //   "timeStamp": "1515043618",
    //   "nonceStr": "V0UGYV...",
    //   "signType": "MD5",
    //   "package": "prepay_id=wx2018...",
    //   "paySign": "54AD...",
    //   "timestamp": "1515043618"
    // }
  }
...
```

### config.wechatPay.client

- **bodyPrefix** `?String` 商品描述的前缀，避免每次都需要写商品描述，[格式见](https://pay.weixin.qq.com/wiki/doc/api/wxa/wxa_api.php?chapter=4_2)
- **appId** `String` 应用的 appId，注意，该应用（小程序，服务号）需要开通微信支付功能，否则会报 `商户号mch_id与appid不匹配` 的错误
- **merchantId** `String` 微信商户号，即 `mch_id`
- **secret** `String` 微信支付的 API 密钥，请到 "微信支付|商户平台 -> API安全" 页面获取
- **notifyUrl** `URL` 接收微信支付异步通知回调地址，通知url必须为直接可访问的url，不能携带参数
- **pfx** `Buffer | String` 微信支付 API 证书（p12证书）

### await wechatPay.requestPayment(order)

- **order** `Object` [统一下单接口](https://pay.weixin.qq.com/wiki/doc/api/wxa/wxa_api.php?chapter=9_1&index=1)的参数
  - **ip** `String` 它是 `spbill_create_ip` 参数的简写
  - 其他参数

返回[再次签名](https://pay.weixin.qq.com/wiki/doc/api/wxa/wxa_api.php?chapter=7_7&index=3)的回调结果，该结果可以直接被小程序，JSBridge，或客户端调用。

```js
const payment = await wechatPay.requestPayment(order)

// https://mp.weixin.qq.com/debug/wxadoc/dev/api/api-pay.html#wxrequestpaymentobject
wx.requestPayment({
  ...payment,
  success (res) {

  },
  fail (res) {

  }
})
```

### wechatPay.newApp(appId)

创建另一个应用的微信支付实例，可创建与同一个微信支付商户绑定的多个应用的实例

```js
const params = this.app.wechatPay.newApp('wx2...')
.requestPayment(order)
```

### await wechatPay.parse(xml)

将微信支付通知中的 `return_msg`(XML) 转换为 JavaScript 对象。XML 通知的结构见 [这个文档](https://pay.weixin.qq.com/wiki/doc/api/wxa/wxa_api.php?chapter=9_7)。

这个方法在转换的过程中，还会结合 [`config.wechatPay.client`](#configwechatpayclient) 校验 XML 是否有效，否则会 reject。

返回 `Object`

### wechatPay.stringify(object)

将 JavaScript 转换为 XML 文本

返回 `String`

### wechatPay.success(ctx)

- **ctx** `EggContext`

向微信返回成功响应

### wechatPay.fail(ctx, message)

- **ctx** `EggContext`
- **message** `String` 作为 `return_msg` 的值

向微信返回失败的响应

## License

MIT
