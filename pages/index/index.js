//index.js
//获取应用实例
const app = getApp()
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
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),

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
    console.log("#事件捕捉:" + e)
    // 获取用户信息
    wx.getSetting({
      success: res => {
        console.log("#获取用户信息>>>")
        console.log(res)
        if (res.authSetting['scope.userInfo', 'scope.userLocation', 'scope.address']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })

    let Index = e.target.dataset.index;
    this.setData({
      editItem: Index + '-' + e.target.dataset.type,
      editIndex: Index,
    })
  },
  bindinput(e) {
    let Index = e.target.dataset.index,
      V = e.detail.value;
    console.log(Index, V)
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
    console.log(productList)
  },

  change(index, type, value) {
    let productList = this.data.productList;
    let groub = this.data.groub;
    if (!productList[index]) {
      console.log("#店铺-基础信息>>>");
      groub[type] = value;
      this.setData({
        groub
      })
      console.log(groub);
    } else {
      console.log("#店铺-商品信息>>>");
      productList[index][type] = value;
      this.setData({
        productList
      })
      console.log(productList)
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
    console.log("#下拉数字选择:" + e)
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
    console.log("#获取手机号:" + JSON.stringify(res))
  },
  
  getLocation(res) {
    console.log("#获取用户地址:" + JSON.stringify(res))
    //** 集中用户授权，方便后续接口调用体验 */
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.userInfo']) {
          wx.authorize({
            scope: 'scope.address',
            success() {
              console.log("#用户地址授权成功");
            }
          })
        }
      }
    })

    let This = this;
    if (this.data.isEdit) {
      let groub = this.data.groub;
      wx.chooseLocation({
        success(res) {
          console.log("#地址选择成功:" + JSON.stringify(res))
          groub.groubAddress = res.address;
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
        console.log(res);
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
        console.log(res)
        let productList = This.data.productList;
        productList[Index].goodsImg = res.tempFilePaths[0];
        This.setData({
          productList,
        })
      }
    })
  },
  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function() {
    wx.showNavigationBarLoading()
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
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