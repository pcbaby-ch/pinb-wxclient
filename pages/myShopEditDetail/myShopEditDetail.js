// pages/myShopEditDetail/myShopEditDetail.js
let util = require("../../utils/util.js")

Page({

  /**
   * Page initial data
   */
  data: {

  },
  // #添加图片*******************************
  addGoodsImg() {
    let that = this
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success(resImage) {
        wx.showLoading({
          title: '上传中...',
        })
        //#后网络上传
        let index = that.data.goodsIndex
        util.log("#goodsIndex:" + index)
        util.imageUpload(resImage, 'dgoodsImg', that, image => {
          util.softTips(that, "图片上传完成")
          let cacheDGoodsImgs = util.getCache(util.cacheKey.goodsImgsNameArray + index) || []
          cacheDGoodsImgs.push(image)
          util.setCache(util.cacheKey.goodsImgsNameArray + index, cacheDGoodsImgs)
          util.log("#cacheDGoodsImgs:" + JSON.stringify(util.getCache(util.cacheKey.goodsImgsNameArray + index)))
          //显示图片
          that.showDgoodsImgs(that, cacheDGoodsImgs)
          wx.hideLoading()
          //编辑图片方法引导提示：
          if (that.data.isEdit == 'true' && cacheDGoodsImgs.length > 0 && cacheDGoodsImgs.length <= 2) {
            util.softTips(that, "长按图片，即删除", 6)
          }
         
        })

      }
    })
  },
  //#长按删除图片****************
  deleteGoodsImg(res) {
    let that = this
    let goodsDetailIndex = res.currentTarget.dataset.index
    let index = this.data.goodsIndex
    //获取图片集：
    let cacheDGoodsImgs = util.getCache(util.cacheKey.goodsImgsNameArray + index) || []
    util.log("#goodsDetailIndex:" + goodsDetailIndex + "#goodsIndex:" + index + "#cacheDGoodsImgs:" + JSON.stringify(cacheDGoodsImgs))
    //删除图片
    cacheDGoodsImgs.splice(goodsDetailIndex, 1)
    //#显示图片
    that.showDgoodsImgs(that, cacheDGoodsImgs)
    util.setCache(util.cacheKey.goodsImgsNameArray + index, cacheDGoodsImgs)
    util.log("#删除详情图片后，#cacheDGoodsImgs:" + JSON.stringify(util.getCache(util.cacheKey.goodsImgsNameArray + index)))
  },

  showDgoodsImgs(that, cacheDGoodsImgs) {
    let goodsImgsArray = []
    for (var i in cacheDGoodsImgs) {
      goodsImgsArray[i] = util.apiHost + "/images/dgoodsImg/" + cacheDGoodsImgs[i]
    }
    that.setData({
      goodsImgsArray,
      isShowBlank: cacheDGoodsImgs && cacheDGoodsImgs.length > 0 ? false : true,
    })
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function(pageRes) {
    let that = this
    wx.showNavigationBarLoading()
    let index = pageRes.goodsIndex
    let isEdit = pageRes.isEdit
    //获取图片集：
    let cacheDGoodsImgs = util.getCache(util.cacheKey.goodsImgsNameArray + index) || []
    util.log("#详情图片集，#dGoodsImgs:" + JSON.stringify(cacheDGoodsImgs))

    //#准备显示详情数据
    that.showDgoodsImgs(that, cacheDGoodsImgs)
    that.setData({ //第几个商品
      goodsIndex: index,
      isEdit: isEdit,
    })
    if (that.data.isEdit == 'true' && cacheDGoodsImgs.length <= 0) {
      util.softTips(that, "点击右下角，添加图片", 6)
    }
    //设置商品详情scrollHeight
    wx.getSystemInfo({
      success: function(res) {
        util.log("#系统信息:" + JSON.stringify(res))
        that.setData({
          scrollHeight: res.windowHeight,
        })
      },
    })
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