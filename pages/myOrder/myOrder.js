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
      wx.navigateTo({
        url: '/pages/login/login',
      })
      return
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

  },

  onNetworkStatusChange: (function(res) {
    if (res.isConnected){

    }else{
      util.softTips("网络连接异常，请检查网络后重试!")
    }
  }),
})