//获取应用实例
var app = getApp()
let util = require("../../utils/util.js")

const defaultOrder = {
  refUserImg: 'wx_head2.jpg',
}
const defalutProduct = {
  groubaTrace: '',
  refGroubTrace: '',
  refUserWxUnionid: '',
  groubaSize: 0,
  groubaMaxCount: 68,
  goodsName: '',
  goodsImg: '',
  goodsPrice: '',
  groubaDiscountAmount: '',
  groubaIsnew: 1,
  groubaExpiredTime: '',
  groubaActiveMinute: '60',
}
Page({
  data: {

    isEdit: true,
    //店铺-基础信息
    groub: {
      groubTrace: "",
      refUserWxUnionid: "",
      groubName: "",
      groubImg: "",
      groubPhone: "",
      groubAddress: "",
      isOpen: "",
    },
    //店铺-商品信息
    productList: [defalutProduct, defalutProduct, defalutProduct],
    editIndex: 0, //当前编辑项
    editItem: '', //当前编辑项 index-type

  },

  arraySetTest(productList) {
    util.log("#productList（变更前）:" + JSON.stringify(productList) + "#00:" + JSON.stringify(productList[0]));
    productList[0]['goodsName'] = "goodsNameA";
    productList[1]['goodsName'] = "goodsNameB";
    //productList[5]['goodsName'] = "goodsNameC";
    util.log("#productList（变更后）:" + JSON.stringify(productList))
  },

  //事件处理函数
  catchtap(e) {
    util.log("#事件捕捉:" + JSON.stringify(e))
    var pageArray = this.data.pageArray
    // this.arraySetTest(pageArray)

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
    this.setData({
      editItem: '',
      editIndex: Index,
    })
    this.change(Index, e.target.dataset.type, V)
  },
  change(index, type, value) {
    var pageArray = this.data.pageArray;
    var groub = this.data.groub;

    if (!pageArray[index]) {
      util.log("#店铺-基础信息,#index:" + index + "#type:" + type + "#value:" + value);
      groub[type] = value;
      this.setData({
        groub
      })
      util.log(JSON.stringify(groub));
    } else {
      pageArray[index][type] = value;
      util.log("#店铺-商品信息,#index:" + index + "#type:" + type + "#value:" + value + "#pageArray:" + JSON.stringify(pageArray));
      this.setData({
        pageArray
      })
      // util.log(JSON.stringify(pageArray))
    }

  },
  /** 右下角编辑 */
  ch_edit() {
    let isEdit = this.data.isEdit
    let pageArray = this.data.pageArray
    this.setData({
      isEdit: !isEdit,
      editItem: '',
    })
    util.log("#isEdit:" + isEdit + "#pageArray.length:" + pageArray.length)
  },
  save() {
    let that = this
    let groub = this.data.groub;
    util.log("#店铺信息" + JSON.stringify(groub))
    let pageArray = this.data.pageArray;
    // util.log("#商品信息" + JSON.stringify(pageArray))
    //填写信息，缓存
    util.putCache(util.cacheKey.groubInfo, null, groub)
    util.setCache(util.cacheKey.goodsList, pageArray)
    //#参数完整性校验
    if (!this.checkParams(groub, pageArray)) {
      return
    }
    //#提交服务器
    util.reqPost(util.apiHost + "/groupBar/add", {
      groub: groub,
      goodsList: pageArray,
      userinfo: util.getCache(util.cacheKey.userinfo),
    }, function success(data) {
      if (data.retCode != '10000') { //#提交失败
        wx.removeStorageSync('isOpenGroub')
        util.softTips(that, data.retMsg, 3)
      } else { //#提交成功
        util.putCache('isOpenGroub', null, true)
        that.setData({
          isEdit: false,
        })
      }
    }, function fail() {

    })

    //#
  },

  add() {
    let pageArray = this.data.pageArray;
    pageArray.push(defalutProduct)
    this.setData({
      pageArray
    })
  },
  set_num(e) {
    util.log("#下拉数字选择:" + JSON.stringify(e.detail))
    let Index = e.target.dataset.index,
      V = e.detail.value;
    let pageArray = this.data.pageArray;
    pageArray[Index].groubaSize = V;
    this.setData({
      pageArray,
      editItem: ''
    })
  },
  switchChange(e) {
    let Index = e.target.dataset.index,
      V = e.detail.value;
    let pageArray = this.data.pageArray;
    pageArray[Index].groubaIsnew = V;
    this.setData({
      pageArray,
      editItem: ''
    })
  },
  getPhoneNumber(e) {
    util.log("#获取手机号:" + JSON.stringify(res))
  },

  getLocation(res) {
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
        let groub = that.data.groub
        groub.groubAddress = res.address;
        groub.latitude = res.latitude;
        groub.longitude = res.longitude;
        util.getCity(res.latitude, res.longitude, util.cacheKey.groubInfo)
        groub.province = util.getCache(util.cacheKey.groubInfo, 'province')
        groub.city = util.getCache(util.cacheKey.groubInfo, 'city')
        util.log("#groub:" + JSON.stringify(groub))
        that.setData({
          groub,
        })
      },
      fail() {
        util.softTips(that, "地址获取失败")
      }
    })
  },
  /** 店铺-图片获取 *********************************/
  upImg() {
    if (!this.data.isEdit) {
      return
    }
    let This = this;
    let groub = this.data.groub;
    var imageMd5 = "'文件md5缺省值'";
    wx.chooseImage({
      count: 1,
      sizeType: ['original'],
      sourceType: ['album', 'camera'],
      success(resImage) {
        util.imageUpload(resImage, This, image => {
          if (image) {
            groub.groubImgView = resImage.tempFilePaths[0]
            groub.groubImg = image
            util.log("#groub:" + JSON.stringify(groub) + "，#resImage:" + JSON.stringify(resImage))
            This.setData({
              groub
            })
          }
        })
      }
    })
  },
  /** 商品-图片获取 *********************************/
  upImg2(e) {
    const Index = e.target.dataset.index;
    let This = this;
    This.setData({
      editIndex: Index,
      editItem: ''
    })
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success(resImage) {
        util.imageUpload(resImage, This, image => {
          if (image) {
            let pageArray = This.data.pageArray;
            pageArray[Index].goodsImgView = resImage.tempFilePaths[0]
            pageArray[Index].goodsImg = image
            This.setData({
              pageArray,
            })
          }
        })

      }
    })
  },

  checkParams(groub, goods) {
    // if (!groub.groubName) {
    //   util.softTips(this, "店铺名称未选择")
    //   return false
    // }
    if (!groub.groubImg) {
      util.softTips(this, "店铺图片未选择")
      return false
    }
    if (!groub.groubAddress) {
      util.softTips(this, "店铺地址未选择")
      return false
    }
    if (!groub.groubPhone) {
      util.softTips(this, "店铺电话未填写")
      return false
    }
    for (var i in goods) {
      let g = goods[i]
      util.log("#单个商品:" + g)
      // if (g.goodsImg) { //#选区商品图片的才校验，没选区的直接忽略废弃
      if (!g.goodsImgView) {
        util.softTips(this, "商品" + i + 1 + ",图片未选取")
        return false
      }
      if (!g.goodsName) {
        util.softTips(this, "商品" + i + 1 + ",名称未填写")
        return false
      }
      if (!g.goodsPrice) {
        util.softTips(this, "商品" + i + 1 + ",原价未填写")
        return false
      }
      if (!g.groubaDiscountAmount) {
        util.softTips(this, "商品" + i + 1 + ",折扣金额未填写")
        return false
      }
      if (g.groubaDiscountAmount > g.goodsPrice) {
        util.softTips(this, "商品" + i + 1 + ",折扣金额过大")
        return false
      }
      // }
    }
    util.softTips(this, "店铺信息,一个月最多更改6次", 3)
    return true
  },

  getGroubInfo(that, groubTrace, orderTrace) {
    util.reqPost(util.apiHost + "/groupBar/selectOne", {
      refUserWxUnionid: groubTrace ? null : util.getCache(util.cacheKey.userinfo, "wxUnionid"),
      groubTrace: groubTrace,
      orderTrace: orderTrace,
    }, resp => {
      if (util.parseResp(that, resp)) {
        resp.data.groubInfo.groubImgView = util.apiHost + "/images/" + resp.data.groubInfo.groubImg
        let curLatitude = util.getCache(util.cacheKey.userinfo, 'latitude')
        let curLongitude = util.getCache(util.cacheKey.userinfo, 'longitude')
        for (var i in resp.data.goodsList) {
          let item = resp.data.goodsList[i]
          resp.data.goodsList[i]['goodsImgView'] = util.apiHost + "/images/" + item.goodsImg
          resp.data.goodsList[i]['distance'] = util.getDistance(curLatitude, curLongitude, item.latitude, item.longitude)
        }
        let pageArray = resp.data.goodsList
        if (pageArray && pageArray.length > 0) {
          for (let i = 0; i < 3 - pageArray.length; i++) {
            pageArray.push(defalutProduct)
          }
        }
        that.setData({
          groub: resp.data.groubInfo,
          pageArray: pageArray,
        })
        util.log("#店铺数据加载完成")
      } else {
        util.log("#店铺数据加载失败")
        that.setData({
          pageArray: that.data.productList,
        })
      }

    })
  },

  onLoad: function(pageRes) {
    wx.showNavigationBarLoading()
    util.log("#页面传参:" + JSON.stringify(pageRes))
    let isOpen = pageRes ? pageRes.isOpen : null
    let groubTrace = pageRes ? pageRes.groubTrace : null
    let orderTrace = pageRes ? pageRes.orderTrace : null
    let orderLeader = pageRes ? pageRes.orderLeader : null
    let that = this

    that.setData({
      isEdit: isOpen,
    })
    //#加载指定商铺的基本信息+商品信息
    that.getGroubInfo(that, groubTrace, orderTrace, orderLeader)
  },
  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady: function() {
    wx.hideNavigationBarLoading()
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
    this.onShow()
    wx.stopPullDownRefresh()
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
  onShareAppMessageA(e) {
    util.onShareAppMessageA(this, e)
  },
  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage(e) {
    util.onShareAppMessage(this, e)
  }
})