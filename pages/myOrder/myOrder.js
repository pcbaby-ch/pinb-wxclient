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

  getMyOrders(page_, rows_) {
    let that = this
    that.setData({
      isLodding: true,
    })
    wx.showNavigationBarLoading()
    util.reqPost(util.apiHost + "/groubaOrder/selectMyOrder4user", {
      refUserWxUnionid: util.getCache(util.cacheKey.userinfo, 'wxUnionid'),
      page: page_,
      rows: rows_,
    }, resp => {
      if (util.parseResp(that, resp)) {
        for (var i in resp.data.rows) {
          resp.data.rows[i]['goodsImgView'] = util.apiHost + "/images/" + resp.data.rows[i].goodsImg
          resp.data.rows[i].userImgs = resp.data.rows[i].userImgs.split(",")
          resp.data.rows[i].ordersStatus = resp.data.rows[i].ordersStatus.split(",")
        }
        let pageArray = that.data.pageArray
        if (page_ == 1) {
          pageArray = [] //如果是首页，则清空分页数据容器
          that.setData({
            isLoadEnd: false,
          })
        }
        pageArray = pageArray.concat(resp.data.rows)
        // util.log("#pageArray:" + JSON.stringify(pageArray))
        that.setData({
          pageArray,
          isLodding: false,
        })
        util.log("#我的订单-数据加载-完成")
      } else {
        util.log("#我的订单-数据加载-失败")
        if (page_ > 1) {
          that.setData({
            isLodding: false,
            isLoadEnd: true,
          })
        } else {
          util.softTips(that, "亲，你暂无订单", 3)
          that.setData({
            pageArray: [],
            isLodding: false,
            isLoadEnd: true,
          })
        }
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    wx.hideNavigationBarLoading();
    wx.stopPullDownRefresh()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function(pageRes) {
    util.log("#页面传参:" + JSON.stringify(pageRes))
    let that = this
    let userinfoCache = util.getCache(util.cacheKey.userinfo)
    if (userinfoCache && userinfoCache.city) {
      util.log("#命中缓存-授权过用户信息")
    } else {
      util.log("#无缓存-未授权过用户信息")
      wx.navigateTo({
        url: '/pages/login/login',
      })
      return
    }
    //#加载统计数据

    that.setData({
      avatarUrl: userinfoCache.avatarUrl,
    })
    //#加载订单数据
    util.pageInitData(that, that.getMyOrders, 6);



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
    util.pageInitData(this, this.getMyOrders, 6)
    wx.stopPullDownRefresh()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    util.log("#已滚到到底部:" + JSON.stringify(this.data.isLoddingEnd))
    if (!this.data.isLoadEnd) {
      util.pageMoreData(this, this.getMyOrders)
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  },

  onNetworkStatusChange: (function(res) {
    if (res.isConnected) {

    } else {
      util.softTips("网络连接异常，请检查网络后重试!")
    }
  }),
})