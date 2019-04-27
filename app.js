//app.js
var util = require("/utils/util.js");
App({
    onLaunch: function() {
      // 登录
      wx.login({
        success: res => {
          util.log("#登陆code:" + res)
          // 发送 res.code 到后台换取 openId, sessionKey, unionId
          util.reqPost(util.apiHost + "/user/getOpenid", {
            "appid": "wx71de1973104f41cf",
            "secret": "8dee514b29b84c7640b842e4e2d521aa",
            "jsCode": res.code,
            "grantType": "authorization_code"
          }, function success(data) {

          }, function fail() {

          })
        }
      })
      /** 快速 测试区 */
      util.setCache("testCache", ["a", "b", "c"])
      util.putCache("testCache", "sex", "man")
      util.log("#testCache:" + (util.apiHost.indexOf("127.0.0.2") ==-1))
      util.putCache("testCache", "name", {
        "name": "cz",
        "age": 23
      })
      util.log("#testCache:" + JSON.stringify(util.getCache("userinfo")))


    },

    globalData: {


    },


  }

)