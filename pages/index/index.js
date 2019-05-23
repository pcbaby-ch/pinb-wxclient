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
    let grouba = this.data.pageArray[res.target.dataset.index]
    if (!grouba) {
      grouba = this.data.shareGoods
    }
    util.log("#touchedElement:" + JSON.stringify(grouba))
    wx.navigateTo({
      url: '/pages/myShop/myShop?groubTrace=' + grouba.refGroubTrace + '&groubaTrace=' + grouba.groubaTrace + '&orderTrace=' + '&isOpen=false'
    })
  },

  goMyShopEdit() {
    wx.navigateTo({
      url: '/pages/myShopEdit/myShopEdit?isOpen=true',
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

  getLocation() {
    let that = this
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.userLocation']) {
          wx.authorize({
            scope: 'scope.userLocation',
            success() {
              util.log("#自动弹出模式授权-成功");
              that.chooseLoc()
            }
          })
        } else {
          util.log("#已经授权-直接获取地址")
          that.chooseLoc()
        }
      }
    })
  },

  chooseLoc() {
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
        util.putCache("page_getNearGrouba", "page", 1) //重置分页为起始页
        that.setData({
          pageArrayContainer: [],
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
          resp.rows[i]['goodsImgView'] = util.apiHost + "/images/" + item.goodsImg
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
        })
        util.log("#附近活动订单-数据加载-完成")
      } else {
        util.log("#附近活动订单-数据加载-失败")
        if (page_ > 1) {
          that.setData({
            isLodding: false,
            isLoadEnd: true,
          })
        } else {
          util.softTips(that, "亲，附近暂无活动商品，请变更位置", 6)
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
   * Lifecycle function--Called when page load
   */
  onLoad: function(pageRes) {
    wx.showNavigationBarLoading()
    util.log("#页面传参onLoad:" + JSON.stringify(pageRes))
    util.putCache('toIndexParams', null, pageRes)
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
    let pageRes = util.getCache('toIndexParams')
    util.log("#页面传参onShow:" + JSON.stringify(pageRes))
    // util.setCache(util.cacheKey.toPageParams, null)
    util.log("#getRemainTime：" + util.getRemainTime('2019-05-22 21:36:53.0'))
    let groubTrace = pageRes ? pageRes.groubTrace : null
    let orderTrace = pageRes ? pageRes.orderTrace : null
    let orderLeader = pageRes ? pageRes.orderLeader : null
    let that = this
    /** 根据首页加载模式加载数据 {userNear userShare userLogin} ############################### */
    let userinfoCache = util.getCache(util.cacheKey.userinfo)
    if (userinfoCache && userinfoCache.nickName) {
      util.log("#命中缓存-授权过用户信息")
      if (groubTrace || orderTrace) {
        wx.navigateTo({
          url: '/pages/index/index?groubTrace=' + groubTrace + '&orderTrace=' + orderTrace + '&orderLeader=' + orderLeader,
        })
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
      isOpen: util.getCache(util.cacheKey.userinfo, "isOpenGroub") == '1' ? true : false,
      avatarUrl: userinfoCache.avatarUrl,
    })

    //#提示未初始选择当前位置
    if (userinfoCache.latitude) {
      //已经初始选过当前位置-加载附近的活动商品信息
      util.pageInitData(that, that.getNearGrouba, 6)
    } else {
      util.log("#未初始选过当前位置")
      // util.softTips(that, "未选择地址，推荐TOP100", 3)
      util.pageInitData(that, that.getNearGrouba, 6)
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
    //   util.pageInitData(this, this.getNearGrouba, 6)
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