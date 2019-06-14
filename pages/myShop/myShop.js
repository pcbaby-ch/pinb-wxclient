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
  groubaSize: 3,
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

    isEdit: false,
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

  chooseLoc() {
    let that = this
    util.chooseLoc4User(this)
  },

  callPhone() {
    wx.makePhoneCall({
      phoneNumber: this.data.groub.groubPhone,
    })
  },

  onLoad: function(pageRes) {
    wx.showNavigationBarLoading()
    util.log("#页面传参:" + JSON.stringify(pageRes))
    util.putCache('gomyShopParams', null, pageRes)
    util.setCache("toIndexParams", null); //清除主页页面传参缓存
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
    util.log("#getRemainTimeTest：" + util.getRemainTime('2019/06/05 21:36:53.0'))
    //#加载指定商铺的基本信息+商品信息
    util.getGroubShareOrder(that, groubTrace, orderTrace, orderLeader)
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

  goGoodsDetail() {
    util.softTips(this, "暂无商品详情页，敬请期待")
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
    let tapGrouba = that.data.pageArray[index]
    if (that.data.shareGoods) {
      util.log("#已经携带分享商品")
      if (!tapGrouba) {
        util.log("#分享：历史分享商品")
        tapGrouba = that.data.shareGoods
      } else {
        util.log("#分享：未被分享商品,则替换当前分享商品和历史分享商品的位置")
        pageArray[index] = that.data.shareGoods
        that.setData({
          shareGoods: tapGrouba,
          pageArray,
        })

      }
    } else {
      util.log("#未携带分享商品")
      /** 将分享商品临时置顶 ############################## */
      pageArray[index] = pageArray[0]
      pageArray[0] = tapGrouba
      that.setData({
        pageArray,
      })
    }
    let titlePrefix = tapGrouba.shareOrder ? "参团立享优惠:" : "开团立享优惠:"
    util.log("#分享活动商品:" + JSON.stringify(tapGrouba))
    util.shareCount(that, tapGrouba.groubaTrace)
    /** 生成分享 ############################################ */
    return {
      title: titlePrefix + tapGrouba.groubaDiscountAmount + "元", // 转发后 所显示的title
      path: '/pages/index/index?groubTrace=' + tapGrouba.refGroubTrace + '&orderTrace=' + tapGrouba.shareOrder + '&orderLeader=' + tapGrouba.shareLeader + '&pageParamsClear=' + true, // 相对的路径
      // imageUrl:'http://127.0.0.1:9660/pinb-service/images/15a9bdccdfc851450bd9ab802c631475.jpg',
      success: (res) => {
        util.log("#分享成功" + res.shareTickets[0])
      },
      fail: function(res) {
        util.log("#分享失败" + res)
      }
    }
  },
})