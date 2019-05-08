//app.js
var util = require("/utils/util.js");
App({
    onLaunch: function() {

      /** 快速 测试区 */
      // wx.removeStorageSync("testCache")
      // //wx.setStorageSync("testCache", "data")
      // util.putCache("testCache", "session_key", "session_key-dfsd")
      // util.log("#testCache0:" + JSON.stringify(util.getCache("testCache")))
      // util.putCache("testCache", "name", ["a", "b", "c"])
      // util.log("#testCache1:" + JSON.stringify(util.getCache("testCache")))

      // util.putCache("testCache", null, {
      //   "name": "cz",
      //   "age": 23
      // })
      // util.log("#testCache2:" + JSON.stringify(util.getCache("testCache")))
      // util.log("#testCache3:" + JSON.stringify(util.getCache(util.cacheKey.isOpen)))
      //#登陆
      wx.showNavigationBarLoading()
      let userinfoCache = util.getCache(util.cacheKey.userinfo)
      let requireLogin = false
      if (userinfoCache) {
        if (userinfoCache.wxOpenid) {
          util.log("#命中登陆缓存-且缓存有效")
        } else {
          util.log("#命中登陆缓存-缓存无效-重新登陆")
          requireLogin = true
        }
      } else {
        requireLogin = true
      }
      //#登陆处理
      if (requireLogin && requireLogin == true) {
        wx.login({
          success: resLogin => {
            util.log("#登陆code:" + JSON.stringify(resLogin))
            if (userinfoCache.system) {
              util.log("#命中缓存-无需再获取用户设备信息")
            } else {
              util.log("#未命中缓存-获取用户设备信息")
              wx.getSystemInfo({
                success: function(res) {
                  util.putCache(util.cacheKey.userinfo, "model", res.model);
                  util.putCache(util.cacheKey.userinfo, "system", res.system);
                  util.putCache(util.cacheKey.userinfo, "brand", res.brand);
                  util.putCache(util.cacheKey.userinfo, "platform", res.platform);
                },
              })
            }
            // 发送 res.code 到后台换取 openId, sessionKey, unionId
            util.reqPost(util.apiHost + "/user/wxLogin", {
              "appid": "wx71de1973104f41cf",
              "secret": "8dee514b29b84c7640b842e4e2d521aa",
              "jsCode": resLogin.code,
              "grantType": "authorization_code",
            }, function success(resp) {
              //#缓存服务端获取的openid、unionid
              util.putCache(util.cacheKey.userinfo, "wxUnionid", resp.data.wxUnionid)
              util.putCache(util.cacheKey.userinfo, "wxOpenid", resp.data.wxOpenid)
              if (util.parseResp(this, resp)) {
                util.log("#登陆成功:" + JSON.stringify(util.getCache(util.cacheKey.userinfo)))
                //根据登陆响应，选择响应页面加载模式{店长端、用户端（附近活动商品）、用户端（店铺商品）}
                util.putCache(util.cacheKey.isOpen, null, true)
                util.putCache(util.cacheKey.groubaTrace, null, resp.data.groubaTrace)
              } else {
                util.log("#登陆异常")
                util.putCache(util.cacheKey.isOpen, null, false)
              }
            }, function fail() {})

          }
        })

      }
    },

    globalData: {


    },


  }

)