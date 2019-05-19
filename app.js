//app.js
var util = require("/utils/util.js");
App({
    onLaunch: function() {

      /** 快速 测试区 */
      util.log("#getRemainTime：" + util.getRemainTime('2019/05/19 19:00:51.0'))
      // util.log("#(新)button模式授权失败，#now:" + Date.parse(new Date()) + "#now+3s:" + Date.parse(new Date())/1000+3)
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
      let userinfoCache = util.getCache(util.cacheKey.userinfo)
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


    },

    globalData: {


    },


  }

)