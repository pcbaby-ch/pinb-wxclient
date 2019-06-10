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
        util.putCache(util.cacheKey.userinfo, "isOpenGroub", 1)
        util.putCache(util.cacheKey.userinfo, "groubTrace", data.data)
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
        let groub = that.data.groub
        groub.groubAddress = res.address;
        groub.latitude = res.latitude;
        groub.longitude = res.longitude;
        util.getCity(res.latitude, res.longitude, util.cacheKey.groubInfo, function() {
          util.log("#选择地址后，开始执行calbackFuction")
          groub.province = util.getCache(util.cacheKey.groubInfo, 'province')
          groub.city = util.getCache(util.cacheKey.groubInfo, 'city')
          util.log("#groub:" + JSON.stringify(groub))
          that.setData({
            groub,
          })
        })
      },
      fail() {
        log("#地址选择失败:" + JSON.stringify(res))
        if (res.errMsg == 'chooseLocation:fail cancel') {
          //如果用户取消选择地址，则不弹出授权列表，
          return
        }
        wx.showModal({
          title: '授权列表',
          content: '请在授权列表，开启位置获取权限',
          success(res) {
            if (res.confirm) {
              wx.openSetting({
                success(data) {}
              })
            }
          }
        })
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
        util.imageUpload(resImage, 'shopImg', This, image => {
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
        util.imageUpload(resImage, 'goodsImg', This, image => {
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

  callPhone() {
    wx.makePhoneCall({
      phoneNumber: this.data.groub.groubPhone,
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
    if (!groub.province || !groub.city) {
      util.softTips(this, "店铺地址，未解析完成，请稍后保存")
      return false
    }
    if (!groub.groubPhone) {
      util.softTips(this, "店铺电话未填写")
      return false
    }
    for (var i in goods) {
      let g = goods[i]
      let index = i * 1 + 1
      util.log("#单个商品:" + g)
      // if (g.goodsImg) { //#选区商品图片的才校验，没选区的直接忽略废弃
      if (!g.goodsImgView) {
        util.softTips(this, "商品" + index + ",图片未选取")
        return false
      }
      if (!g.goodsName) {
        util.softTips(this, "商品" + index + ",名称未填写")
        return false
      }
      if (!g.goodsPrice) {
        util.softTips(this, "商品" + index + ",原价未填写")
        return false
      }
      if (!g.groubaDiscountAmount) {
        util.softTips(this, "商品" + index + ",折扣金额未填写")
        return false
      }
      if (g.groubaDiscountAmount * 1 > g.goodsPrice * 1) {
        util.softTips(this, "商品" + index + ",折扣金额过大")
        util.log("#groubaDiscountAmount:" + g.groubaDiscountAmount + "#goodsPrice:" + g.goodsPrice)
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
        resp.data.groubInfo.groubImgView = util.apiHost + "/images/shopImg/" + resp.data.groubInfo.groubImg
        let curLatitude = util.getCache(util.cacheKey.userinfo, 'latitude')
        let curLongitude = util.getCache(util.cacheKey.userinfo, 'longitude')
        for (var i in resp.data.goodsList) {
          let item = resp.data.goodsList[i]
          resp.data.goodsList[i]['goodsImgView'] = util.apiHost + "/images/goodsImg/" + item.goodsImg
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
  /** 生长并展示店铺二维码 */
  toQrCode: function(res) {
    util.log("#res:" + JSON.stringify(res))
    let order = this.data.pageArray[res.currentTarget.dataset.index]
    util.log("#二维码信息:" + that.data.groub.groubTrace)
    //#生成二维码
    createShopQR()
  },

  closePay: function() {

    this.setData({
      payContainerShow: 'none',
    })
  },

  createShopQR() {
    let that = this
    let groub = that.data.groub
    util.reqPost(util.apiHost + "/groupBar/getShopQR", {
      "appid": util.appid,
      "secret": util.secret,
      groubTrace: groub.groubTrace,
    }, resp => {
      if (util.parseResp(that, resp)) {
        util.log("#店铺二维码生成成功:" + resp)
        groub.shopQR = util.apiHost + "/images/shopQR/" + resp.data.data
        that.setData({
          groub,
          payContainerShow: 'true',
        })
      }
    })
  },
  /** 长按店铺二维码保存 */
  //点击开始时的时间
  timestart: function(e) {　　
    var that = this;　　
    that.setData({
      timestart: e.timeStamp
    });
  },

  //点击结束的时间
  timeend: function(e) {　　
    var that = this;　　
    that.setData({
      timeend: e.timeStamp
    });
  },

  //保存图片
  saveImg: function(e) {　　
    var that = this;　　
    var times = that.data.timeend - that.data.timestart;　　
    if (times > 300) {　　　　
      util.log("#长按");　　　　
      wx.getSetting({　　　　　　
        success: function(res) {　　　　　　　　
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: function(res) {
              util.log("#保存相册授权成功");
              var imgUrl = that.data.groub.shopQR //图片地址
              wx.downloadFile({ //下载文件资源到本地，客户端直接发起一个 HTTP GET 请求，返回文件的本地临时路径
                url: imgUrl,
                　success: function(res) {　　　
                  util.log('#下载成功后再保存到本地' + JSON.stringify(res));　
                  wx.saveImageToPhotosAlbum({　　　　　　
                    filePath: res.tempFilePath, //返回的临时文件路径，下载后的文件会存储到一个临时文件
                  })　
                  util.softTips(that, "二维码已保存到相册", 5)
                  that.setData({
                    payContainerShow: 'none',
                  })
                }
              })　　　　　　　　　　
            }　　　　　　　　
          })　　　　　　
        }　　　　
      })　　
    }
  },


  onLoad: function(pageRes) {
    wx.showNavigationBarLoading()
    util.log("#页面传参:" + JSON.stringify(pageRes))
    let groubTrace = pageRes ? pageRes.groubTrace : null
    let orderTrace = pageRes ? pageRes.orderTrace : null
    let orderLeader = pageRes ? pageRes.orderLeader : null
    let that = this
    if (util.getCache(util.cacheKey.userinfo, "isOpenGroub") == '1') {
      util.softTips(this, "点击店铺图片，生成您的专属二维码", 6)
    }
    that.setData({
      isEdit: util.getCache(util.cacheKey.userinfo, "isOpenGroub") == '1' ? false : true,
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
    util.softTips(this, "当前预览页面，无法开团")
  },
  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage(e) {
    util.onShareAppMessage(this, e)
  }
})