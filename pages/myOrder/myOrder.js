let util = require("../../utils/util.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    wx.showNavigationBarLoading();
    let userinfoCache = util.getCache(util.cacheKey.userinfo)
    let pageMode = ""
    if (userinfoCache && userinfoCache.city) {
      util.log("#命中缓存-授权过用户信息")
      pageMode = "myOrder"
    } else {
      util.log("#无缓存-未授权过用户信息")
      pageMode = "userLogin"
    }
    this.setData({
      pageMode,
    })
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
      that.onLoad()
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
                    that.onLoad()
                  }
                })
              }
            })
          }
        }
      })
    }

  },

  scanPayCode: function() {
    let that = this
    wx.scanCode({
      onlyFromCamera: true,
      success(res) {
        console.log("#扫码结果:" + JSON.stringify(res))
        wx.setNavigationBarTitle({
          title: res.result,
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    wx.hideNavigationBarLoading();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})