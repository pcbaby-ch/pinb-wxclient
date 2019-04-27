//index.js
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
  groubaMaxCount: 8,
  goodsName: '',
  goodsImg: '',
  goodsPrice: '',
  groubaDiscountAmount: '',
  groubaIsnew: 1,
  groubaExpiredTime: '',
  groubaActiveMinute: '',
  refUsers: [defaultOrder, defaultOrder, defaultOrder, defaultOrder, defaultOrder, defaultOrder],
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

    img: ''
  },

  //事件处理函数
  catchtap(e) {
    util.log("#事件捕捉:" + JSON.stringify(e))

    let Index = e.target.dataset.index;
    this.setData({
      editItem: Index + '-' + e.target.dataset.type,
      editIndex: Index,
    })
  },
  bindinput(e) {
    let Index = e.target.dataset.index,
      V = e.detail.value;
    util.log(Index, V)
    this.change(Index, e.target.dataset.type, V)
  },
  ch_edit() {
    this.setData({
      isEdit: !this.data.isEdit,
      editItem: ''
    })
  },
  save() {
    this.setData({
      usToast: {
        text: '店铺信息一个月内只能修改6次',
        time: 3
      }
    })
    let productList = this.data.productList;
    util.log(productList)
  },

  change(index, type, value) {
    let productList = this.data.productList;
    let groub = this.data.groub;
    if (!productList[index]) {
      util.log("#店铺-基础信息>>>");
      groub[type] = value;
      this.setData({
        groub
      })
      util.log(groub);
    } else {
      util.log("#店铺-商品信息>>>");
      productList[index][type] = value;
      this.setData({
        productList
      })
      util.log(productList)
    }

  },
  add() {
    let productList = this.data.productList;
    productList.push(defalutProduct)
    this.setData({
      productList
    })
  },
  set_num(e) {
    let Index = e.target.dataset.index,
      V = e.detail.value;
    let productList = this.data.productList;
    productList[Index].groubaSize = V;
    util.log("#下拉数字选择:" + e)
    this.setData({
      productList,
      editItem: ''
    })
  },
  switchChange(e) {
    let Index = e.target.dataset.index,
      V = e.detail.value;
    let productList = this.data.productList;
    productList[Index].groubaIsnew = V;
    this.setData({
      productList,
      editItem: ''
    })
  },
  getPhoneNumber(e) {
    util.log("#获取手机号:" + JSON.stringify(res))
  },

  getLocation(res) {
    util.log(util.apiHost+"#获取用户地址:" + JSON.stringify(res))
    //** 集中用户授权，方便后续接口调用体验 */
    if (wx.canIUse('button.open-type.getUserInfo')) {
      util.log("#button模式授权成功，并获取用户信息" + JSON.stringify(res.detail.userInfo))
      util.setCache(util.cacheKey.userinfo, res.detail.userInfo)
      util.log("#userinfo:" + JSON.stringify(util.getCache(util.cacheKey.userinfo)))
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
                    util.setCache(util.cacheKey.userinfo, res.userInfo)
                    util.log("#userinfo:" + JSON.stringify(util.getCache(util.cacheKey.userinfo)))
                  }
                })
              }
            })
          }
        }
      })
    }
    wx.getSystemInfo({
      success: function(res) {
        util.log("#获取用户设备信息成功:" + JSON.stringify(res))
        util.putCache(util.cacheKey.userinfo, "model", res.model);
        util.putCache(util.cacheKey.userinfo, "system", res.system);
        util.putCache(util.cacheKey.userinfo, "brand", res.brand);
        util.putCache(util.cacheKey.userinfo, "platform", res.platform);
        util.log("#userinfo:" + JSON.stringify(util.getCache(util.cacheKey.userinfo)))
      },
    })

    let This = this;
    if (this.data.isEdit) {
      let groub = this.data.groub;
      wx.chooseLocation({
        success(res) {
          util.log("#地址选择成功:" + JSON.stringify(res))
          groub.groubAddress = res.address;
          util.putCache(util.cacheKey.userinfo, "address", res.address)
          util.log("#userinfo:" + JSON.stringify(util.getCache(util.cacheKey.userinfo)))
          This.setData({
            groub
          })
        },
        fail() {
          This.setData({
            usToast: {
              text: '地址获取失败',
              time: 3
            }
          })
        }
      })
    } else {

    }
  },


  /** 店铺-图片获取 *********************************/
  upImg() {
    if (!this.data.isEdit) {
      return
    }
    let This = this;
    let groub = this.data.groub;
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        // tempFilePath可以作为img标签的src属性显示图片
        util.log(res);
        groub.groubImg = res.tempFilePaths[0];
        This.setData({
          groub
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
      success(res) {
        // tempFilePath可以作为img标签的src属性显示图片
        util.log(res)
        let productList = This.data.productList;
        productList[Index].goodsImg = res.tempFilePaths[0];
        This.setData({
          productList,
        })
      }
    })
  },


  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function() {
    wx.showNavigationBarLoading()

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

  },

  /**
   * Called when page reach bottom
   */
  onReachBottom: function() {

  },

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage: function() {

  }
})