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
          let goodsImgsNameArray = that.data.goodsImgsNameArray || []
          let goodsImgsNameArrayCache = util.getCache(util.cacheKey.goodsImgsNameArray + index) || []
          if (goodsImgsNameArray.length <= 0) { //初次进入详情页,将缓存数据置入
            goodsImgsNameArray = goodsImgsNameArrayCache
            util.log("#初始置入缓存数据")
          }
          goodsImgsNameArray.push(image)
          util.setCache(util.cacheKey.goodsImgsNameArray + index, goodsImgsNameArray)
          util.log("#goodsImgsNameArray:" + JSON.stringify(goodsImgsNameArray))
          util.log("#goodsImgsNameArrayCache:" + JSON.stringify(util.getCache(util.cacheKey.goodsImgsNameArray + index)))
          //显示图片
          let goodsImgsArray = []
          for (var i in goodsImgsNameArray) {
            goodsImgsArray[i] = util.apiHost + "/images/dgoodsImg/" + goodsImgsNameArray[i]
          }
          that.setData({
            goodsImgsArray,
            goodsImgsNameArray,
          })
          wx.hideLoading()
        })

      }
    })
  },
  //#长按删除图片****************
  deleteGoodsImg(res) {
    let that = this
    let goodsDetailIndex = res.currentTarget.dataset.index
    let index = this.data.goodsIndex
    util.log("#goodsDetailIndex:" + goodsDetailIndex + "#goodsIndex:" + index)
    let goodsImgsNameArray = that.data.goodsImgsNameArray || []
    let goodsImgsNameArrayCache = util.getCache(util.cacheKey.goodsImgsNameArray + index) || []
    if (goodsImgsNameArray.length <= 0) { //初次进入详情页,将缓存数据置入
      goodsImgsNameArray = goodsImgsNameArrayCache
      util.log("#初始置入缓存数据")
    }
    goodsImgsNameArray.splice(goodsDetailIndex, 1)
    //#显示图片
    let goodsImgsArray = []
    for (var i in goodsImgsNameArray) {
      goodsImgsArray[i] = util.apiHost + "/images/dgoodsImg/" + goodsImgsNameArray[i]
    }
    this.setData({
      goodsImgsArray,
      goodsImgsNameArray,
    })
    util.putCache(util.cacheKey.goodsImgsNameArray + this.data.goodsIndex, null, goodsImgsNameArray)

  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function(pageRes) {
    wx.showNavigationBarLoading()
    util.softTips(this, "长按图片即删除", 6)
    let index = pageRes.goodsIndex
    util.log("goodsIndex:" + index)
    //图片集：
    let goodsImgsNameArray = util.getCache(util.cacheKey.goodsImgsNameArray + index)
    if (pageRes.goodsImgsNameArray) { //如果是详情查询，页面传参，则优先
      util.log("#详情图片集来源：页面传参")
      goodsImgsNameArray = pageRes.goodsImgsNameArray
      util.setCache(util.cacheKey.goodsImgsNameArray + pageRes.goodsIndex, null) //初始化缓存
      util.putCache(util.cacheKey.goodsImgsNameArray + pageRes.goodsIndex, null, goodsImgsNameArray)
    }
    util.log("#详情图片集，#goodsImgsNameArray:" + JSON.stringify(goodsImgsNameArray))
    let goodsImgsArray = []
    for (var i in goodsImgsNameArray) {
      goodsImgsArray[i] = util.apiHost + "/images/dgoodsImg/" + goodsImgsNameArray[i]
    }
    this.setData({
      goodsIndex: pageRes.goodsIndex,
      goodsImgsArray: goodsImgsArray || [],
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