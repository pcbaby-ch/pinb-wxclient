//app.js
var util = require("/utils/util.js");
App({
    onLaunch: function() {
      //#如果缓存显示，用户一直未入驻，则直接进入编辑模式，并提示用户填写店铺商品信息
      if (util.getCache(util.cacheKey.loginTips)) {
        util.log("#未入驻，无需登陆")
        return
      }

      // 登录
      wx.login({
        success: res => {
          util.log("#登陆code:" + JSON.stringify(res))
          if (util.getCache(util.cacheKey.userinfo, "system")) {
            util.log("#命中缓存-无需再获取用户设备信息")
          } else {
            util.log("#未命中缓存-获取用户设备信息")
            wx.getSystemInfo({
              success: function(res) {
                util.putCache(util.cacheKey.userinfo, "model", res.model);
                util.putCache(util.cacheKey.userinfo, "system", res.system);
                util.putCache(util.cacheKey.userinfo, "brand", res.brand);
                util.putCache(util.cacheKey.userinfo, "platform", res.platform);
                util.log("#userinfo:" + JSON.stringify(util.getCache(util.cacheKey.userinfo)))
              },
            })
          }

          // 发送 res.code 到后台换取 openId, sessionKey, unionId
          util.reqPost(util.apiHost + "/user/wxLogin4Shop", {
            "appid": "wx71de1973104f41cf",
            "secret": "8dee514b29b84c7640b842e4e2d521aa",
            "jsCode": res.code,
            "grantType": "authorization_code",
            "phone": util.getCache(util.cacheKey.userinfo, "phone"),
            "headImg": util.getCache(util.cacheKey.userinfo, "avatarUrl"),
            "brand": util.getCache(util.cacheKey.userinfo, "brand"),
            "model": util.getCache(util.cacheKey.userinfo, "model"),
            "system": util.getCache(util.cacheKey.userinfo, "system"),
            "platform": util.getCache(util.cacheKey.userinfo, "platform"),
            "benchmark": util.getCache(util.cacheKey.userinfo, "benchmark"),
            "nickname": util.getCache(util.cacheKey.userinfo, "nickname"),
            "city": util.getCache(util.cacheKey.userinfo, "city"),
            "province": util.getCache(util.cacheKey.userinfo, "province"),
            "latitude": util.getCache(util.cacheKey.userinfo, "latitude"),
            "longitude": util.getCache(util.cacheKey.userinfo, "longitude"),
          }, function success(data) {
            util.log("#data:" + JSON.stringify(data))
            if (data.retCode != '10000') {
              //未入驻，进入编辑模式，完善店铺商品信息
              util.putCache(util.cacheKey.loginTips, null, {
                "text": data.retMsg,
                time: 3
              })
            } else {
              //已入驻，展示店铺商品信息
              wx.removeStorageSync(util.cacheKey.loginTips)
            }
          }, function fail() {

          })

        }
      })
      /** 快速 测试区 */
      wx.removeStorageSync("testCache")
      //wx.setStorageSync("testCache", "data")
      util.putCache("testCache", "session_key", "session_key-dfsd")
      util.log("#testCache0:" + JSON.stringify(util.getCache("testCache")))
      util.putCache("testCache", "name", ["a", "b", "c"])
      util.log("#testCache1:" + JSON.stringify(util.getCache("testCache")))

      util.putCache("testCache", null, {
        "name": "cz",
        "age": 23
      })
      util.log("#testCache2:" + JSON.stringify(util.getCache("testCache")))
      util.log("#testCache3:" + JSON.stringify(util.getCache("testCache", "age")))

    },

    globalData: {


    },


  }

)