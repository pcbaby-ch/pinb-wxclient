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
      url: '/pages/myShop/myShop?isOpen=true',
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

  getGroubInfo(groubTrace, orderTrace, orderLeader) {
    let that = this
    util.reqPost(util.apiHost + "/groupBar/selectOneShare", {
      groubTrace: groubTrace,
      orderTrace: orderTrace,
      orderLeader: orderLeader,
      refUserWxUnionid: util.getCache(util.cacheKey.userinfo, 'wxUnionid'),
    }, resp => {
      if (util.parseResp(that, resp)) {
        let curLatitude = util.getCache(util.cacheKey.userinfo, 'latitude')
        let curLongitude = util.getCache(util.cacheKey.userinfo, 'longitude')
        resp.data.groubInfo.groubImgView = util.apiHost + "/images/" + resp.data.groubInfo.groubImg
        if (resp.data.shareGoods) { //如果存在分享商品
          resp.data.shareGoods.goodsImgView = util.apiHost + "/images/" + resp.data.shareGoods.goodsImg
          resp.data.shareGoods['distance'] = util.getDistance(curLatitude, curLongitude, resp.data.shareGoods.latitude, resp.data.shareGoods.longitude)
          resp.data.shareGoods.userImgs = resp.data.shareGoods.userImgs.split(",")
          resp.data.shareGoods.ordersStatus = resp.data.shareGoods.ordersStatus.split(",")
        }
        for (var i in resp.data.goodsList) {
          let item = resp.data.goodsList[i]
          resp.data.goodsList[i]['goodsImgView'] = util.apiHost + "/images/" + item.goodsImg
          resp.data.goodsList[i]['distance'] = util.getDistance(curLatitude, curLongitude, item.latitude, item.longitude)
          if (item.userImgs) { //如果存在订单头像信息
            resp.data.goodsList[i].userImgs = item.userImgs.split(",")
            resp.data.goodsList[i].ordersStatus = item.ordersStatus.split(",")
          }
        }
        that.setData({
          groub: resp.data.groubInfo,
          pageArray: resp.data.goodsList,
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
          util.softTips(that, "亲，附近暂无活动商品", 6)
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
    util.putCache(util.cacheKey.toPageParams, null, pageRes)
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
    let pageRes = util.getCache(util.cacheKey.toPageParams)
    wx.removeStorage(util.cacheKey.toPageParams+"")
    util.log("#页面传参onShow:" + JSON.stringify(pageRes))
    let groubTrace = pageRes.groubTrace
    let orderTrace = pageRes.orderTrace
    let orderLeader = pageRes.orderLeader
    let that = this
    /** 根据首页加载模式加载数据 {userNear userShare userLogin} ############################### */
    let isLoadData = true
    let indexMode = "userNear"
    let userinfoCache = util.getCache(util.cacheKey.userinfo)
    if (userinfoCache && userinfoCache.nickName) {
      util.log("#命中缓存-授权过用户信息")
      if (orderTrace && orderTrace) {
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
      isOpen: util.getCache(util.cacheKey.userinfo, "isOpenGroub") == '1' ? true : false,
      avatarUrl: userinfoCache.avatarUrl,
    })
    /** 根据页面加载规则，加载对于数据 ################################## */
    if (indexMode == "userShare") {
      //#加载指定商铺的基本信息+商品信息（如果是分享来源，则需要去除分享订单对应的商品）+ 分享活动商品（带订单信息）
      that.getGroubInfo(groubTrace, orderTrace, orderLeader)
    } else if (indexMode == "userNear") {
      //#提示未初始选择当前位置
      if (userinfoCache.latitude) {
        //已经初始选过当前位置-加载附近的活动商品信息
        util.pageInitData(that, that.getNearGrouba, 6)
      } else {
        util.log("#未初始选过当前位置")
        // util.softTips(that, "未选择地址，推荐TOP100", 3)
        util.pageInitData(that, that.getNearGrouba, 6)
      }
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

  onShareAppMessageA(e) {
    util.log("#分享防止冒泡方法hack")
    let that = this;
    let index = e.target.dataset.index
    let pageArray = that.data.pageArray
    let pageArray0 = pageArray[0]
    let tapGrouba = pageArray[index]
    if (!tapGrouba) {
      tapGrouba = that.data.shareGoods
      if (tapGrouba.isJoined) {
        util.log("#已参团-纯分享")
      } else {
        util.log("#参团下单,#商品:" + JSON.stringify(tapGrouba))
        that.orderJoin(tapGrouba.shareOrder, tapGrouba.shareLeader)
      }
    } else {
      if (tapGrouba.isJoined) {
        util.log("#已参团-纯分享")
        pageArray[index] = pageArray0
        pageArray[0] = tapGrouba
        that.setData({
          pageArray,
        })
      } else {
        util.log("#开团下单")
        that.orderOpen(tapGrouba)
      }
    }
    // util.log("#拼团活动商品:" + JSON.stringify(tapGrouba))
  },

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage(e) {
    let that = this;
    let index = e.target.dataset.index
    let tapGrouba = that.data.pageArray[index]
    let titlePrefix = '开团立享优惠:'
    if (!tapGrouba) {
      titlePrefix = "参团立享优惠:"
      tapGrouba = that.data.shareGoods
    }
    util.log("#分享活动商品:" + JSON.stringify(tapGrouba))
    /** 生成分享 ############################################ */
    return {
      title: titlePrefix + tapGrouba.groubaDiscountAmount + "元", // 转发后 所显示的title
      path: '/pages/index/index?groubTrace=' + tapGrouba.refGroubTrace + '&orderTrace=' + tapGrouba.shareOrder + '&orderLeader=' + tapGrouba.shareLeader + '&isOpen=false', // 相对的路径
      // imageUrl:'http://127.0.0.1:9660/pinb-service/images/15a9bdccdfc851450bd9ab802c631475.jpg',
      success: (res) => {
        util.log("#分享成功" + res.shareTickets[0])
      },
      fail: function(res) {
        util.log("#分享失败" + res)
      }
    }
  },
  /** 开团服务请求 args{tapGrouba:开团商品信息}*/
  orderOpen(tapGrouba) {
    util.reqPost(util.apiHost + "/groubaOrder/orderOpen", {
      refGroubTrace: tapGrouba.refGroubTrace,
      refGroubaTrace: tapGrouba.groubaTrace,
      orderExpiredTime: tapGrouba.groubaActiveMinute,
      refUserWxUnionid: util.getCache(util.cacheKey.userinfo, "wxUnionid"),
      refUserImg: util.getCache(util.cacheKey.userinfo, "avatarUrl"),
      goodsName: tapGrouba.goodsName,
      goodsImg: tapGrouba.goodsImg,
      goodsPrice: tapGrouba.goodsPrice,
      groubaDiscountAmount: tapGrouba.groubaDiscountAmount,
      groubaIsnew: tapGrouba.groubaIsnew,
    }, resp => {
      if (util.parseResp(this, resp)) {
        // util.softTips(this, "开团成功")
        this.onShow()
      }
    })
  },
  /** 参团服务请求 args{orderTrace:原团订单号,refUserWxUnionid:原团团长}*/
  orderJoin(orderTrace, orderLeader) {
    util.reqPost(util.apiHost + "/groubaOrder/orderJoin", {
      orderTrace: orderTrace,
      leader: orderLeader,
      refUserWxUnionid: util.getCache(util.cacheKey.userinfo, "wxUnionid"),
      refUserImg: util.getCache(util.cacheKey.userinfo, "avatarUrl"),
    }, resp => {
      if (util.parseResp(this, resp)) {
        // util.softTips(this, "参团成功")
        this.onShow()
      }
    })
  },

})