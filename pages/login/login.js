let util = require("../../utils/util.js")

Page({

  /**
   * Page initial data
   */
  data: {

  },

  /** 微信登陆--共用js 注意保持多个页面js同步此方法逻辑########## */
  wxLogin(res) {
    let that = this
    if (wx.canIUse('button.open-type.getUserInfo')) {
      util.log("#(新)button模式授权成功，并获取用户信息" + JSON.stringify(res.detail.userInfo))
      util.putCache(util.cacheKey.userinfo, null, res.detail.userInfo)
      util.putCache(util.cacheKey.userinfo, "encryptedData", res.detail.encryptedData)
      util.putCache(util.cacheKey.userinfo, "iv", res.detail.iv)
      // util.log("#userinfo:" + JSON.stringify(util.getCache(util.cacheKey.userinfo)))
      wx.navigateBack({
        delta: 1,
      })
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
                    // util.log("#userinfo:" + JSON.stringify(util.getCache(util.cacheKey.userinfo)))
                    wx.navigateBack({
                      delta: 1,
                    })
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