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


  onLoad: function(pageRes) {
    wx.showNavigationBarLoading()
    util.log("#页面传参:" + JSON.stringify(pageRes))
    util.putCache('gomyShopParams', null, pageRes)
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
    let pageRes = util.getCache("gomyShopParams")
    let groubTrace = pageRes ? pageRes.groubTrace : null
    let orderTrace = pageRes ? pageRes.orderTrace : null
    let orderLeader = pageRes ? pageRes.orderLeader : null
    let that = this
    util.log("#myShop.onShow().userinfo:" + util.getCache(util.cacheKey.userinfo))
    //#加载指定商铺的基本信息+商品信息
    util.getGroubInfo(that, groubTrace, orderTrace, orderLeader)
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
    let that = this
    let index = e.target.dataset.index
    let pageArray = that.data.pageArray
    let pageArray0 = pageArray[0]
    let tapGrouba = pageArray[index]
    let titlePrefix = '开团立享优惠:'
    if (!tapGrouba) {
      titlePrefix = "参团立享优惠:"
      tapGrouba = that.data.shareGoods
    }
    util.log("#分享活动商品:" + JSON.stringify(tapGrouba))
    /** 生成分享 ############################################ */
    return {
      title: titlePrefix + tapGrouba.groubaDiscountAmount + "元", // 转发后 所显示的title
      path: '/pages/index/index?groubTrace=' + tapGrouba.refGroubTrace + '&orderTrace=' + tapGrouba.shareOrder + '&orderLeader=' + tapGrouba.shareLeader, // 相对的路径
      // imageUrl:'http://127.0.0.1:9660/pinb-service/images/15a9bdccdfc851450bd9ab802c631475.jpg',
      success: (res) => {
        util.log("#分享成功" + res.shareTickets[0])
      },
      fail: function(res) {
        util.log("#分享失败" + res)
      }
    }
  }
})