let util = require("../../utils/util.js")
var QRCode = require('../../utils/weapp-qrcode.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {

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
        //请求：消费处理服务接口
        util.reqPost(util.apiHost + "/groubaOrder/orderConsume", {
          orderTrace: res.result.split("|")[1],
          refUserWxUnionid: util.getCache(util.cacheKey.userinfo, 'wxUnionid'),
          refGroubTrace: res.result.split("|")[0],
        }, resp => {
          if (util.parseResp(that, resp)) {

          }
        })
      }
    })
  },

  toQrCode: function(res) {
    util.log("#res:" + JSON.stringify(res))
    let order = this.data.pageArray[res.currentTarget.dataset.index]
    util.log("#消费活动商品:" + JSON.stringify(order))
    //#生成二维码
    var qrcode = new QRCode('canvas', {
      // usingIn: this,
      text: order.refGroubTrace + '|' + order.orderTrace,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });

    this.setData({
      payContainerShow: true,
      shadeCoverShow: true,
    })
  },

  closePay: function() {

    this.setData({
      payContainerShow: 'none',
      shadeCoverShow: 'none',
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
      if (util.parseResp(that, resp) && resp.data.rows.length > 0) {
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
   * 生命周期函数--监听页面加载
   */
  onLoad: function(pageRes) {
    wx.showNavigationBarLoading()
    util.log("#页面传参:" + JSON.stringify(pageRes))
    let that = this
    let userinfoCache = util.getCache(util.cacheKey.userinfo)
    if (userinfoCache && userinfoCache.nickName) {
      util.log("#命中缓存-授权过用户信息")
    } else {
      util.log("#无缓存-未授权过用户信息")
      if (util.getCache("reLoginTime") && Date.parse(new Date()) / 1000 < util.getCache("reLoginTime")) {
        util.log("#3秒内只能登录一次" + util.formatTime(new Date()))
        wx.hideNavigationBarLoading()
        return
      }
      util.putCache("reLoginTime", null, Date.parse(new Date()) / 1000 + 3)
      wx.navigateTo({
        url: '/pages/login/login',
      })
      return
    }
    //#加载统计数据

    that.setData({
      isOpen: util.getCache(util.cacheKey.userinfo, "isOpenGroub") == '1' ? true : false,
      avatarUrl: userinfoCache.avatarUrl,
    })
    //#加载订单数据
    util.pageInitData(that, that.getMyOrders, 6);



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

  onShareAppMessageA() {
    util.log("#分享防止冒泡方法hack")
  },

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage(e) {
    let that = this;
    let index = e.target.dataset.index
    let pageArray = that.data.pageArray
    let pageArray0 = pageArray[0]
    let tapGrouba = pageArray[index]
    pageArray[0] = tapGrouba
    pageArray[index] = pageArray0
    that.setData({
      pageArray,
    })
    util.log("#分享活动商品:" + JSON.stringify(tapGrouba))
    /** 生成分享 ############################################ */
    return {
      title: '参团立省' + tapGrouba.groubaDiscountAmount + "元", // 转发后 所显示的title
      path: '/pages/index/index?groubTrace=' + tapGrouba.refGroubTrace + '&orderTrace=' + tapGrouba.shareOrder + '&orderLeader=' + tapGrouba.shareLeader + '&isOpen=false', // 相对的路径
      // imageUrl:'http://127.0.0.1:9660/pinb-service/images/15a9bdccdfc851450bd9ab802c631475.jpg',
      success: (res) => { // 成功后要做的事情
        util.log("#分享成功" + res.shareTickets[0])

        wx.getShareInfo({
          shareTicket: res.shareTickets[0],
          success: (res) => {
            that.setData({
              isShow: true
            })
            util.log(that.setData.isShow)
          },
          fail: function(res) {
            console.log(res)
          },
          complete: function(res) {
            console.log(res)
          }
        })
      },
      fail: function(res) {
        // 分享失败
        util.log("#分享失败" + res)
      }
    }
  },

})