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
  getPhoneNumber(e) {
    console.log(e)
  },
  data: {
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),

    isEdit: true,
    storeImg: '',
    productList: [defalutProduct, defalutProduct, defalutProduct],
    editIndex: 0, //当前编辑项
    editItem: '', //当前编辑项 index-type
    location: {},
    img:''
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
  ch_edit () {
    this.setData({ isEdit: !this.data.isEdit, editItem:''})
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
    productList[index][type] = value
    this.setData({
      productList
    })
    console.log(productList)
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
      editItem:''
    })
  },
  getLocation(){
    let This = this;
    if (!this.data.location.latitude||this.data.isEdit) {
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
    }else{
      wx.openLocation({
        latitude:this.data.location.latitude,
        longitude:this.data.location.longitude
      })
    }
  },
  upImg(){
    if(!this.data.isEdit){return}
    let This=this;
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        // tempFilePath可以作为img标签的src属性显示图片
        console.log(res)
        This.setData({ img: res.tempFilePaths[0]})
      }
    })
  },
  upImg2(e){
    const Index=e.target.dataset.index;
    let This = this;
    This.setData({ editIndex:Index,editItem:'' })
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
  onLoad: function() {
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
  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  }
})