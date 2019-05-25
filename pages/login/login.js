let util = require("../../utils/util.js")

Page({

  /**
   * Page initial data
   */
  data: {

  },

  getUserinfo2Login() {
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
    if (requireLogin && requireLogin == true) {
      /** 登陆静默注册 */
      wx.login({
        success: resLogin => {
          util.log("#登陆code:" + JSON.stringify(resLogin))

          // 发送 res.code 到后台换取 openId, sessionKey, unionId
          util.reqPost(util.apiHost + "/user/wxLogin", {
            "appid": util.appid,
            "secret": util.secret,
            "jsCode": resLogin.code,
            "grantType": "authorization_code",
            'headImg': util.getCache(util.cacheKey.userinfo, "avatarUrl"),
            'model': util.getCache(util.cacheKey.userinfo, "model"),
            'system': util.getCache(util.cacheKey.userinfo, "system"),
            'brand': util.getCache(util.cacheKey.userinfo, "brand"),
            'platform': util.getCache(util.cacheKey.userinfo, "platform"),
            'nickName': util.getCache(util.cacheKey.userinfo, "nickName"),
            'gender': util.getCache(util.cacheKey.userinfo, "gender"),
            'city': util.getCache(util.cacheKey.userinfo, "city"),
            'province': util.getCache(util.cacheKey.userinfo, "province"),
            'country': util.getCache(util.cacheKey.userinfo, "country"),

          }, function success(resp) {
            //#缓存服务端获取的openid、unionid
            util.putCache(util.cacheKey.userinfo, "wxUnionid", resp.data.wxUnionid)
            util.putCache(util.cacheKey.userinfo, "wxOpenid", resp.data.wxOpenid)
            util.putCache(util.cacheKey.userinfo, "isOpenGroub", resp.data.isOpenGroub)
            if (util.parseResp(this, resp)) {
              util.log("#登陆成功:" + JSON.stringify(util.getCache(util.cacheKey.userinfo)))
            } else {
              util.log("#登陆异常")
            }
            wx.navigateBack({
              delta: 1,
            })
          }, function fail() {})

        }
      })

    } else {
      /** 登陆缓存有效，无需登陆 */
      wx.navigateBack({
        delta: 1,
      })
    }
  },

  /** 微信登陆--共用js 注意保持多个页面js同步此方法逻辑########## */
  wxLogin(res) {
    let that = this
    if (wx.canIUse('button.open-type.getUserInfo')) {
      if (res.detail.userInfo) {
        util.log("#(新)button模式授权成功，并获取用户信息" + JSON.stringify(res.detail.userInfo))
        util.putCache(util.cacheKey.userinfo, null, res.detail.userInfo)
        // util.putCache(util.cacheKey.userinfo, "encryptedData", res.detail.encryptedData)
        // util.putCache(util.cacheKey.userinfo, "iv", res.detail.iv)
        util.log("#userinfo:" + JSON.stringify(util.getCache(util.cacheKey.userinfo)))
        /** 服务端登陆+静默注册 */
        that.getUserinfo2Login()
      } else {
        util.putCache("reLoginTime", null, Date.parse(new Date()) / 1000 + 3)
        util.log("#(新)button模式授权失败，#reLoginTime:" + util.getCache("reLoginTime") + "#now+3s:" + Date.parse(new Date()) / 1000 + 3)
      }
    } else {
      util.log("#(旧)自动弹出模式授权，并获取用户信息")
      wx.getSetting({
        success(res) {
          if (!res.authSetting['scope.userInfo']) {
            wx.authorize({
              scope: 'scope.userInfo',
              success() {
                util.log("#(旧)自动弹出模式授权-成功-开始获取用户信息");
                wx.getUserInfo({
                  success: res => {
                    util.putCache(util.cacheKey.userinfo, null, res.userInfo)
                    util.log("#userinfo:" + JSON.stringify(util.getCache(util.cacheKey.userinfo)))
                    /** 服务端登陆+静默注册 */
                    that.getUserinfo2Login()
                  }
                })
              }
            })
          }
        }
      })
    }

  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function(options) {

  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady: function() {

  },

  /**
   * Lifecycle function--Called when page show
   */
  onShow: function() {

  },

  /**
   * Lifecycle function--Called when page hide
   */
  onHide: function() {

  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload: function() {

  },

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh: function() {

  },

  /**
   * Called when page reach bottom
   */
  onReachBottom: function() {

  },

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage: function() {

  }
})