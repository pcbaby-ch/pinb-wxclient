//index.js
//获取应用实例
var app = getApp()
let util = require("../../utils/util.js")

Page({
  data: {
    searchAddress: util.getCache(util.cacheKey.userinfo, "address"),
    searchText: util.getCache("searchText"),
    indexMode: 'userNear',
    /** 附件的商品list页面-分页数据容器 */
    pageArrayContainer: [],
    repeat: 0,

  },
  /** 页面跳转 ##################################*/
  goMyShop(res) {
    util.log("#res:" + JSON.stringify(res))
    let index = res.target.dataset.index
    let grouba = index >= 0 ? this.data.pageArray[index] : null
    util.log("#touchedElement:" + JSON.stringify(grouba))

    let url = grouba ? '/pages/myShop/myShop?groubTrace=' + grouba.refGroubTrace + '&groubaTrace=' + grouba.groubaTrace : '/pages/myShop/myShop'

    wx.navigateTo({
      url: url
    })
  },

  goMyShopEdit() {
    wx.navigateTo({
      url: '/pages/myShopEdit/myShopEdit?isOpenGroub=true',
    })
  },

  goIndex() {
    this.setData({
      indexMode: 'userNear',
    })
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

  chooseLoc() {
    util.chooseLoc4User(this)

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
        let curLatitude = util.getCache(util.cacheKey.userinfo, 'latitude')
        let curLongitude = util.getCache(util.cacheKey.userinfo, 'longitude')
        for (var i in resp.rows) {
          let item = resp.rows[i]
          resp.rows[i]['goodsImgView'] = util.apiHost + "/images/goodsImg/" + item.goodsImg
          resp.rows[i]['distance'] = util.getDistance(curLatitude, curLongitude, item.latitude, item.longitude)
        }
        let pageArray = that.data.pageArray
        if (page_ == 1) {
          pageArray = [] //如果是首页，则清空分页数据容器
          that.setData({
            isLoadEnd: false,
          })
        }
        pageArray = pageArray.concat(resp.rows)
        // util.log("#pageArray:" + JSON.stringify(pageArray))
        that.setData({
          pageArray,
          isLodding: false,
          isShowBlank: false,
        })
        util.log("#附近活动订单-数据加载-完成")
      } else {
        util.log("#附近活动订单-数据加载-失败")
        if (page_ > 1) {
          that.setData({
            isLodding: false,
            isLoadEnd: true,
            isShowBlank: false,
          })
        } else {
          util.softTips(that, "亲，附近暂无活动商品，请变更位置", 5)
          that.setData({
            pageArray: [],
            isLodding: false,
            isLoadEnd: true,
            isShowBlank: true,
          })
        }
      }
    })
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function(pageRes) {
    wx.showNavigationBarLoading()
    util.log("#页面传参onLoad:" + JSON.stringify(pageRes))
    util.putCache('toIndexParams', null, pageRes) //清除店铺页面传参缓存
  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady: function(pageRes) {
    wx.hideNavigationBarLoading()
  },

  /**
   * Lifecycle function--Called when page show
   */
  onShow: function() {
    let that = this
    let pageRes = util.getCache('toIndexParams')
    util.setCache("gomyShopParams", null);
    util.log("#页面传参onShow:" + JSON.stringify(pageRes))
    let searchAddress = util.getCache(util.cacheKey.userinfo, "address")
    that.setData({
      searchAddress: searchAddress || null,
    })
    let groubTrace = pageRes ? pageRes.groubTrace : null
    //扫描进入小程序的店铺trace
    groubTrace = pageRes && pageRes.scene ? pageRes.scene : groubTrace
    let orderTrace = pageRes ? pageRes.orderTrace : null
    let orderLeader = pageRes ? pageRes.orderLeader : null
    /** 根据首页加载模式加载数据 {userNear userShare userLogin} ############################### */
    let userinfoCache = util.getCache(util.cacheKey.userinfo)
    if (userinfoCache && userinfoCache.nickName && userinfoCache.wxUnionid) {
      util.log("#命中缓存-授权过用户信息")
      if (groubTrace || orderTrace) {
        wx.navigateTo({
          url: '/pages/myShop/myShop?groubTrace=' + groubTrace + '&orderTrace=' + orderTrace + '&orderLeader=' + orderLeader,
        })
        if (pageRes && pageRes.pageParamsClear) {
          util.setCache('toIndexParams', null)
        }
        return
      }
    } else {
      util.log("#无缓存-未授权过用户信息,#reLoginTime:" + JSON.stringify(util.getCache("reLoginTime")) + "#now:" + Date.parse(new Date()) / 1000)
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
    that.setData({
      isOpenGroub: util.getCache(util.cacheKey.userinfo, "isOpenGroub") == '1' ? true : false,
      avatarUrl: userinfoCache.avatarUrl,
    })

    //#提示未初始选择当前位置
    if (userinfoCache.latitude) {
      //已经初始选过当前位置-加载附近的活动商品信息
      util.pageInitData(that, that.getNearGrouba)
    } else {
      util.log("#未初始选过当前位置")
      // util.softTips(that, "未选择地址，推荐TOP100", 3)
      util.pageInitData(that, that.getNearGrouba)
    }

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
    // if (this.data.indexMode == 'userNear') {
    //   util.pageInitData(this, this.getNearGrouba)
    // } else {
    //   wx.stopPullDownRefresh()
    // }
    this.onShow()
    wx.stopPullDownRefresh()
  },

  /**
   * Called when page reach bottom
   */
  onReachBottom: function() {
    if (!this.data.isLoadEnd && this.data.indexMode == 'userNear') {
      util.log("#已滚到到底部-翻页:" + JSON.stringify(this.data.isLoddingEnd))
      util.pageMoreData(this, this.getNearGrouba)
    } else {
      util.log("#已滚到到底部-不翻页:" + JSON.stringify(this.data.isLoddingEnd))
    }
  },

})