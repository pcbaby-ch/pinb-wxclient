let util = require("../../utils/util.js")
var QRCode = require('../../utils/weapp-qrcode.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  scanPayCode: function(res) {
    let that = this
    var formId = res.detail.formId
    wx.scanCode({
      onlyFromCamera: true,
      success(res) {
        console.log("#扫码结果:" + JSON.stringify(res))
        //请求：消费处理服务接口
        util.reqPost(util.apiHost + "/groubaOrder/orderConsume", {
          orderTrace: res.result.split("|")[0],
          refUserWxUnionid: res.result.split("|")[1],
          refGroubTrace: util.getCache(util.cacheKey.userinfo, 'groubTrace'),
          formId: formId,
        }, resp => {
          if (util.parseResp(that, resp)) {
            util.softTips(that, "扫码确认成功", 3)
          }
        })
      }
    })
  },

  toQrCode: function(res) {
    let that = this
    util.log("#res:" + JSON.stringify(res))
    let index = res.detail.target.dataset.index
    var formId = res.detail.formId
    let order = this.data.pageArray[index]
    util.log("#消费活动商品:" + JSON.stringify(order))
    //#是否成团校验
    if (([2, 3, 5, 6, 8, 9][order.groubaSize]) > order.ordersStatus.length) {
      util.softTips(this, "亲，未成团不能生成消费码")
      return
    }
    const ctx = wx.createCanvasContext('paycanvas');
    wx.getSystemInfo({
      success: function(res) {
        wx.get
        var heightrate = res.screenHeight / 680
        var widthrate = res.screenWidth / 680
        util.log("#ctx:" + JSON.stringify(ctx) + "#res:" + JSON.stringify(res) + "#heightrate:" + heightrate + "#widthrate:" + widthrate+"#")
        //#生成二维码
        var qrcode = new QRCode('paycanvas', {
          // usingIn: this,
          text: order.orderTrace + '|' + order.refUserWxUnionid,
          width: res.screenWidth*0.9,
          height: res.screenWidth * 0.9,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H,
        })
      },
    })



    //请求：消费准备服务接口
    util.reqPost(util.apiHost + "/groubaOrder/orderConsumePrepare", {
      orderTrace: order.orderTrace,
      refUserWxUnionid: order.refUserWxUnionid,
      formId: formId,
    }, resp => {
      if (util.parseResp(that, resp)) {
        util.log("#消费码生成完成")
        that.setData({
          payContainerShow: true,
          shadeCoverShow: true,
        })
      }
    })
  },

  closePay: function() {

    this.setData({
      payContainerShow: 'none',
      shadeCoverShow: 'none',
    })
  },

  getMyOrdersToggle() {
    let url = "selectMyOrder4user"
    if (this.data.getMyOrderUrl != 'selectMyOrder4Shop') {
      url = 'selectMyOrder4Shop'
    }
    this.setData({
      getMyOrderUrl: url,
    })
    util.pageInitData(this, this.getMyOrders)
    // this.onLoad()
  },

  getMyOrders(page_, rows_) {
    let that = this
    that.setData({
      isLodding: true,
    })
    wx.showNavigationBarLoading()
    let url = that.data.getMyOrderUrl
    url = url ? util.apiHost + "/groubaOrder/" + url : util.apiHost + "/groubaOrder/selectMyOrder4user"
    util.reqPost(url, {
      refUserWxUnionid: util.getCache(util.cacheKey.userinfo, 'wxUnionid'), //普通用户userid
      refGroubTrace: util.getCache(util.cacheKey.userinfo, 'groubTrace'), //店长店铺trace
      page: page_,
      rows: rows_,
    }, resp => {
      if (util.parseResp(that, resp) && resp.data.rows.length > 0) {
        for (var i in resp.data.rows) {
          resp.data.rows[i]['goodsImgView'] = util.apiHost + "/images/goodsImg/" + resp.data.rows[i].goodsImg
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
          isShowBlank: false,
        })
        util.log("#我的订单-数据加载-完成")
      } else {
        util.log("#我的订单-数据加载-失败")
        if (page_ > 1) {
          that.setData({
            isLodding: false,
            isLoadEnd: true,
            isShowBlank: false,
          })
        } else {
          util.softTips(that, "亲，你暂无订单", 3)
          that.setData({
            pageArray: [],
            isLodding: false,
            isLoadEnd: true,
            isShowBlank: true,
          })
        }
      }
      that.setData({
        isOpenGroub: util.getCache(util.cacheKey.userinfo, "isOpenGroub") == '1' ? true : false,
      })
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(pageRes) {
    wx.showNavigationBarLoading()

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
    let that = this
    let userinfoCache = util.getCache(util.cacheKey.userinfo)
    if (userinfoCache && userinfoCache.nickName && userinfoCache.wxUnionid) {
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
    util.pageInitData(that, that.getMyOrders);
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
    util.pageInitData(this, this.getMyOrders)
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
    let that = this
    let index = e.target.dataset.index
    let pageArray = that.data.pageArray
    let tapGrouba = that.data.pageArray[index]
    let titlePrefix = tapGrouba.shareOrder ? "参团立享优惠:" : "开团立享优惠:"
    util.log("#分享活动商品:" + JSON.stringify(tapGrouba))
    /** 将分享商品临时置顶 ############################## */
    pageArray[index] = pageArray[0]
    pageArray[0] = tapGrouba
    that.setData({
      pageArray,
    })
    util.shareCount(that, tapGrouba.refGroubaTrace)
    /** 生成分享 ############################################ */
    return {
      title: titlePrefix + tapGrouba.groubaDiscountAmount + "元", // 转发后 所显示的title
      path: '/pages/index/index?groubTrace=' + tapGrouba.refGroubTrace + '&orderTrace=' + tapGrouba.shareOrder + '&orderLeader=' + tapGrouba.shareLeader + '&pageParamsClear=' + true, // 相对的路径
      // imageUrl:'http://127.0.0.1:9660/pinb-service/images/15a9bdccdfc851450bd9ab802c631475.jpg',
      success: (res) => {
        util.log("#分享成功" + res.shareTickets[0])
      },
      fail: function(res) {
        util.log("#分享失败" + res)
      }
    }
  },

})