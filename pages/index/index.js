//index.js
//获取应用实例
const app = getApp()
const defalutProduct = {
  name: '',
  img: '',
  oldPrice: '',
  price: '',
  numIndex: 0,
  endTimeH: '1',
  endTimeM: '',
  maxNum: '6',
  isPullNew: true,
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
      isOpen:"",
    },
    //店铺-商品信息
    productList: [defalutProduct, defalutProduct, defalutProduct],
    editIndex: 0, //当前编辑项
    editItem: '', //当前编辑项 index-type
    location: {},
    img: ''
  },
  //事件处理函数
  catchtap(e) {
    console.log(e)
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
    this.setData({ isEdit: !this.data.isEdit, editItem: '' })
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
      console.log("#店铺-商品信息");
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
    productList[Index].numIndex = V;
    console.log(e)
    this.setData({
      productList,
      editItem: ''
    })
  },
  switchChange(e) {
    let Index = e.target.dataset.index,
      V = e.detail.value;
    let productList = this.data.productList;
    productList[Index].isPullNew = V;
    this.setData({
      productList,
      editItem: ''
    })
  },
  getPhoneNumber(e) {
    console.log(e)
  },
  getLocation() {
    //** 集中用户授权，方便后续接口调用体验 */
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.userInfo', 'scope.userLocation', 'scope.address']) {
          wx.authorize({
            scope: 'scope.userInfo',
            success() {
              console.log("用户基本信息授权成功");
            }
          })
          wx.authorize({
            scope: 'scope.userLocation',
            success() {
              console.log("用户地理位置授权成功");
            }
          })
          wx.authorize({
            scope: 'scope.address',
            success() {
              console.log("用户地址授权成功");
            }
          })
        }
      }
    })
    let This = this;
    if (!this.data.location.latitude || this.data.isEdit) {
      wx.chooseLocation({
        success(res) {
          console.log(res)
          This.setData({ location: res })
        },
        fail() {
          This.setData({
            usToast: {
              text: '获取微信信息失败',
              time: 3
            }
          })
        }
      })
    } else {
      wx.openLocation({
        latitude: this.data.location.latitude,
        longitude: this.data.location.longitude
      })
    }
  },

  initAuth: function () {
    //** 集中用户授权，方便后续接口调用体验 */
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.userInfo', 'scope.userLocation', 'scope.address']) {
          wx.authorize({
            scope: 'scope.userInfo',
            success() {
              console.log("用户基本信息授权成功");
            }
          })
          wx.authorize({
            scope: 'scope.userLocation',
            success() {
              console.log("用户地理位置授权成功");
            }
          })
          wx.authorize({
            scope: 'scope.address',
            success() {
              console.log("用户地址授权成功");
            }
          })
        }
      }
    })
  },

  upImg() {
    if (!this.data.isEdit) { return }
    let This = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        // tempFilePath可以作为img标签的src属性显示图片
        console.log(res)
        This.setData({ img: res.tempFilePaths[0] })
      }
    })
  },
  upImg2(e) {
    const Index = e.target.dataset.index;
    let This = this;
    This.setData({ editIndex: Index, editItem: '' })
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        // tempFilePath可以作为img标签的src属性显示图片
        console.log(res)
        let productList = This.data.productList;
        productList[Index].img = res.tempFilePaths[0];
        This.setData({
          productList,
        })
      }
    })
  },
  onLoad: function () {
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
  getUserInfo: function (e) {
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
  onLoad: function (options) {

  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady: function () {

  },

  /**
   * Lifecycle function--Called when page show
   */
  onShow: function () {

  },

  /**
   * Lifecycle function--Called when page hide
   */
  onHide: function () {

  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload: function () {

  },

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh: function () {

  },

  /**
   * Called when page reach bottom
   */
  onReachBottom: function () {

  },

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage: function () {

  }
})