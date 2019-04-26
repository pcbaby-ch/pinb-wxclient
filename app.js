//app.js
var util = require("/utils/util.js");
App({
    onLaunch: function() {
      // 登录
      wx.login({
        success: res => {
          console.log("#登陆code:" + res)
          wx.getSystemInfo({
            success: function(res) {
              console.log("#登陆-获取用户设备信息:" + JSON.stringify(res))
            },
          })
          // 发送 res.code 到后台换取 openId, sessionKey, unionId
          util.reqPost(this.globalData.apiHost + "/user/getOpenid", {
            "appid": "wx71de1973104f41cf",
            "secret": "8dee514b29b84c7640b842e4e2d521aa",
            "jsCode": res.code,
            "grantType": "authorization_code"
          }, function success(data) {

          }, function fail() {

          })
        }
      })

    },

    globalData: {
      //#api服务host地址 https://apitest.pinb.vip/pinb-service
      apiHost: "http://127.0.0.1:9660/pinb-service",
      //#用户-基础信息
      userInfo: null,
      //#用户-更多信息
      userInfoDetail: null,
      //#店铺-基本信息
      shopInfo: null,
      //#店铺-商品信息
      shopGoods: null,
    },




  }

)