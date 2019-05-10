//index.js
//获取应用实例
var app = getApp()
let util = require("../../utils/util.js")

Page({
  data: {
    searchAddress: util.getCache(util.cacheKey.userinfo, "address"),
    searchText: util.getCache("searchText"),
    indexMode: 'userNear',



  },

  //事件处理函数
  catchtap(e) {
    util.log("#事件捕捉:" + JSON.stringify(e))
    var productList = this.data.productList
    // this.arraySetTest(productList)

    let Index = e.target.dataset.index;
    this.setData({
      editItem: Index + '-' + e.target.dataset.type,
      editIndex: Index,
    })
  },
  /** 空间失去焦点触发事件 */
  bindinput(e) {
    let Index = e.target.dataset.index,
      V = e.detail.value;
    util.log("#控件失去焦点,#index:" + Index + "#value:" + V + "#e:" + JSON.stringify(e))
    this.change(Index, e.target.dataset.type, V)
  },
  change(index, type, value) {
    var productList = this.data.productList;
    var groub = this.data.groub;

    if (!productList[index]) {
      util.log("#店铺-基础信息,#index:" + index + "#type:" + type + "#value:" + value);
      groub[type] = value;
      this.setData({
        groub
      })
      util.log(JSON.stringify(groub));
    } else {
      productList[index][type] = value;
      util.log("#店铺-商品信息,#index:" + index + "#type:" + type + "#value:" + value + "#productList:" + JSON.stringify(productList));
      this.setData({
        productList
      })
      // util.log(JSON.stringify(productList))
    }

  },

  getLocation() {
    let that = this
    wx.chooseLocation({
      success(res) {
        util.log("#地址选择成功:" + JSON.stringify(res))
        util.putCache(util.cacheKey.userinfo, "address", res.name)
        util.putCache(util.cacheKey.userinfo, "latitude", res.latitude)
        util.putCache(util.cacheKey.userinfo, "longitude", res.longitude)
        util.log("#userinfo:" + JSON.stringify(util.getCache(util.cacheKey.userinfo)))
        that.setData({
          searchAddress: res.name,
        })
        that.onLoad()
      },
      fail() {
        that.setData({
          usToast: {
            text: '地址获取失败',
            time: 3
          }
        })
      }
    })

  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function(pageRes) {
    wx.showNavigationBarLoading()
    util.log("#页面传参:" + JSON.stringify(pageRes))
    let groubTrace = pageRes ? pageRes.groubTrace : null
    let groubaTrace = pageRes ? pageRes.groubaTrace : null
    let orderTrace = pageRes ? pageRes.orderTrace : null
    let that = this
    /** 根据首页加载模式加载数据 {userNear userShare userLogin} ############################### */
    let isLoadData = true
    let indexMode = "userNear"
    let userinfoCache = util.getCache(util.cacheKey.userinfo)
    if (userinfoCache && userinfoCache.city) {
      util.log("#命中缓存-授权过用户信息")
      if (groubaTrace && orderTrace) {
        indexMode = "userShare"
      }
    } else {
      util.log("#无缓存-未授权过用户信息")
      wx.navigateTo({
        url: '/pages/login/login',
      })
      return
    }
    that.setData({
      indexMode,
    })
    /** 根据页面加载规则，加载对于数据 ################################## */
    if (indexMode == "userShare") {
      //#加载指定商铺的基本信息+商品信息（如果是分享来源，则需要去除分享订单对应的商品）+ 分享活动商品（带订单信息）
      that.getGroubInfo(groubTrace, orderTrace)
    } else if (indexMode == "userNear") {
      //#提示未初始选择当前位置
      if (userinfoCache.latitude) {
        //已经初始选过当前位置-加载附近的活动商品信息
        util.pageInitData(that.getNearGrouba, 6)

      } else {
        util.log("#未初始选过当前位置")
        util.softTips(that, "亲，请选择你的位置", 6)
      }


    }

  },

  getGroubInfo(groubTrace, orderTrace) {
    let that = this
    util.reqPost(util.apiHost + "/groupBar/selectOne", {
      refUserWxUnionid: groubTrace ? null : util.getCache(util.cacheKey.userinfo, "wxUnionid"),
      groubTrace: groubTrace,
      orderTrace: orderTrace,
      refUserWxUnionid: util.getCache(util.cacheKey.userinfo, 'wxUnionid')
    }, resp => {
      if (util.parseResp(that, resp)) {
        resp.data.groubInfo.groubImgView = util.apiHost + "/images/" + resp.data.groubInfo.groubImg
        for (var i in resp.data.goodsList) {
          resp.data.goodsList[i]['goodsImgView'] = util.apiHost + "/images/" + resp.data.goodsList[i].goodsImg
        }
        that.setData({
          groub: resp.data.groubInfo,
          productList: resp.data.goodsList,
          shareGoods: resp.data.shareGoods,
        })
        util.log("#店铺or分享活动商品-数据加载-完成")
      } else {
        util.log("#店铺or分享活动商品-数据加载-失败")
      }
    })
  },

  getNearGrouba(page_, rows_) {
    let that = this
    that.setData({
      isLodding: true,
    })
    wx.showNavigationBarLoading()
    util.reqPost(util.apiHost + "/groubActivity/selectNearGrouba", {
      province: util.getCache(util.cacheKey.userinfo, "province"),
      city: util.getCache(util.cacheKey.userinfo, "city"),
      latitude: util.getCache(util.cacheKey.userinfo, "latitude"),
      longitude: util.getCache(util.cacheKey.userinfo, "longitude"),
      page: page_,
      rows: rows_,
    }, resp => {
      if (resp.retCode == '10000' && resp.rows.length > 0) {
        for (var i in resp.rows) {
          resp.rows[i]['goodsImgView'] = util.apiHost + "/images/" + resp.rows[i].goodsImg
        }
        let pageArrayContainer = []
        pageArrayContainer[page_] = resp.rows
        that.setData({
          pageArrayContainer,
          isLodding: false,
        })
        util.log("#附近活动订单-数据加载-完成")
      } else {
        util.softTips(that, "亲，当前位置附近暂无活动商品", 6)
        util.log("#附近活动订单-数据加载-失败")
        if (page_ > 1) {
          that.setData({
            isLodding: false,
            isLoddingEnd: true,
          })
        }
      }
    })
  },

  scrollToBottom(e) {
    util.log("#已滚到到底部:" + JSON.stringify(e))
    util.pageMoreData(this.getNearGrouba)
  },


  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady: function() {
    wx.hideNavigationBarLoading()
    // 快速测试区


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

  toQrCode: function() {
    //#生成二维码
    var qrcode = new QRCode('canvas', {
      // usingIn: this,
      text: "orderNumber" + util.formatTime(new Date()),

      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });

    qrcode.makeCode("orderNumber" + util.formatTime(new Date()))

    this.setData({
      payContainerShow: true,
    })
  },

  closePay: function() {
    this.setData({
      payContainerShow: false,
    })
  },
  shareGrouba(e) {
    let productList = this.data.productList
    util.log("#商品活动分享:" + JSON.stringify(productList))
    let index = e.target.dataset.index
    let productList0 = productList[0]
    productList[0] = productList[index]
    productList[index] = productList0
    this.setData({
      productList,
    })
  },
  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage(e) {
    let that = this;
    let index = e.target.dataset.index
    let productList = this.data.productList
    let productList0 = productList[0]
    productList[0] = productList[index]
    productList[index] = productList0
    this.setData({
      productList,
    })
    return {
      title: '参团立享优惠' + util.getCache(util.cacheKey.isOpen), // 转发后 所显示的title
      path: '/pages/index/index?groubaTrace=GA2019050600000004', // 相对的路径
      // imageUrl:'http://127.0.0.1:9660/pinb-service/images/15a9bdccdfc851450bd9ab802c631475.jpg',
      success: (res) => { // 成功后要做的事情
        util.log("#分享成功" + res.shareTickets[0])

      },
      fail: function(res) {
        // 分享失败
        util.log("#分享失败" + res)
      }
    }
  },

})