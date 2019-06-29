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
    let goodsImgsNameArray = that.data.goodsImgsNameArray || []
    util.log("#goodsDetailIndex:" + goodsDetailIndex + "#goodsIndex:" + index + "#goodsImgsNameArray:" + JSON.stringify(goodsImgsNameArray))

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
    util.setCache(util.cacheKey.goodsImgsNameArray + index, null) //重置缓存
    util.putCache(util.cacheKey.goodsImgsNameArray + index, null, goodsImgsNameArray)
    util.log("#删除详情图片后，#goodsImgsNameArray:" + JSON.stringify(goodsImgsNameArray))
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function(pageRes) {
    let that = this
    wx.showNavigationBarLoading()
    let index = pageRes.goodsIndex
    let groubaTrace = pageRes.groubaTrace
    let isEdit = pageRes.isEdit
    if (isEdit && isEdit == 'true') {
      util.softTips(that, "长按图片，即删除", 6)
    }
    util.log("#商品详情页-传入参数:" + JSON.stringify(pageRes))
    //获取图片集：
    let goodsImgsNameArray = util.getCache(util.cacheKey.goodsImgsNameArray + index)
    if (!goodsImgsNameArray) { //如果是首次详情查询跳转，则查库
      util.log("#详情图片集来源：首次从DB获取详情数据")
      util.reqPost(util.apiHost + "/groubActivity/selectOne", {
        groubaTrace: groubaTrace,
      }, function success(resp) {
        if (resp.retCode != '10000') { //#失败
          util.softTips(that, resp.retMsg, 3)
          util.log("#商品详情查询失败,")
        } else { //#成功
          //显示图片
          let goodsImgsArray = []
          let goodsImgsNameArray = resp.data.dGoodsImgs ? JSON.parse(resp.data.dGoodsImgs) : []
          for (var i in goodsImgsNameArray) {
            goodsImgsArray[i] = util.apiHost + "/images/dgoodsImg/" + goodsImgsNameArray[i]
          }
          that.setData({
            goodsImgsArray,
            goodsImgsNameArray,
            isShowBlank: goodsImgsNameArray && goodsImgsNameArray.length > 0 ? false : true,
          })
          util.putCache(util.cacheKey.goodsImgsNameArray + index, null, goodsImgsNameArray)
        }
      }, function fail() {

      })
    }
    util.log("#详情图片集，#goodsImgsNameArray:" + JSON.stringify(goodsImgsNameArray))
    let goodsImgsArray = []
    for (var i in goodsImgsNameArray) {
      goodsImgsArray[i] = util.apiHost + "/images/dgoodsImg/" + goodsImgsNameArray[i]
    }
    that.setData({
      goodsIndex: index,
      goodsImgsArray: goodsImgsArray || [],
      goodsImgsNameArray,
      isShowBlank: goodsImgsNameArray && goodsImgsNameArray.length > 0 ? false : true,
      isEdit,
    })
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