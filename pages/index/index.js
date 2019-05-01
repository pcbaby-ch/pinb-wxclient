//index.js
//获取应用实例
var app = getApp()
let util = require("../../utils/util.js")
var Promise = require("../../utils/bluebird.min.js")
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
  groubaActiveMinute: '60',
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
    util.log("#控件失去焦点,#index:" + Index + "#value:" + V + "#e:" + JSON.stringify(e))
    this.change(Index, e.target.dataset.type, V)
  },
  ch_edit() {
    this.setData({
      isEdit: !this.data.isEdit,
      editItem: ''
    })
  },
  save() {

    let groub = this.data.groub;
    util.log("#店铺信息" + JSON.stringify(groub))
    let productList = this.data.productList;
    util.log("#商品信息" + JSON.stringify(productList))
    //#参数完整性校验
    this.checkParams(groub, productList)
    //#提交服务器
    util.reqPost(util.apiHost + "/groupBar/add", {
      groub: groub,
      goodsList: productList,
    }, function success(data) {
      if (data.retCode != '10000') { //#提交失败
        wx.removeStorageSync(util.cacheKey.isOpen)
        util.softTips(that, data.retMsg,3)
      } else { //#提交成功
        util.putCache(util.cacheKey.isOpen, "isOpen", true)
        this.setData({
          isEdit: false,
        })
      }
    }, function fail() {

    })

    //#
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
      util.log(JSON.stringify(groub));
    } else {
      util.log("#店铺-商品信息>>>");
      productList[index][type] = value;
      this.setData({
        productList
      })
      // util.log(JSON.stringify(productList))
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
    util.log("#下拉数字选择:" + JSON.stringify(e.detail))
    let Index = e.target.dataset.index,
      V = e.detail.value;
    let productList = this.data.productList;
    productList[Index].groubaSize = V;
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
    util.log(util.apiHost + "#获取用户地址:" + JSON.stringify(res))
    //** 集中用户授权，方便后续接口调用体验 */
    if (wx.canIUse('button.open-type.getUserInfo')) {
      util.log("#button模式授权成功，并获取用户信息" + JSON.stringify(res.detail.userInfo))
      util.putCache(util.cacheKey.userinfo, null, res.detail.userInfo)
      util.putCache(util.cacheKey.userinfo, "encryptedData", res.detail.encryptedData)
      util.putCache(util.cacheKey.userinfo, "iv", res.detail.iv)
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
                    util.putCache(util.cacheKey.userinfo, null, res.userInfo)
                    util.log("#userinfo:" + JSON.stringify(util.getCache(util.cacheKey.userinfo)))
                  }
                })
              }
            })
          }
        }
      })
    }

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
          //util.log("#请求后台服务，解析encryptedData")

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
    var imageMd5 = "'文件md5缺省值'";
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success(resImage) {
        util.imageUpload(resImage, This, imageMd5 => {
          groub.groubImgView = resImage.tempFilePaths[0]
          groub.groubImg = imageMd5;
          util.log("#groub:" + JSON.stringify(groub))
          This.setData({
            groub
          })
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
        util.imageUpload(resImage, This, imageMd5 => {
          let productList = This.data.productList;
          productList[Index].goodsImgView = resImage.tempFilePaths[0]
          productList[Index].goodsImg = imageMd5;
          This.setData({
            productList,
          })
        })

      }
    })
  },

  checkParams(groub, goods) {
    if (!groub.groubName) {
      util.softTips(this, "店铺名称未选择")
      return
    }
    if (!groub.groubImg) {
      util.softTips(this, "店铺图片未选择")
      return
    }
    if (!groub.groubAddress) {
      util.softTips(this, "店铺地址未选择")
      return
    }
    if (!groub.groubPhone) {
      util.softTips(this, "店铺电话未填写")
      return
    }
    for (var i in goods) {
      let g = goods[i]
      util.log("#单个商品:" + g)
      if (g.goodsImg) { //#选区商品图片的才校验，没选区的直接忽略废弃
        if (!g.goodsName) {
          util.softTips(this, "商品" + i + ",名称未填写")
          return
        }
        if (!g.goodsPrice) {
          util.softTips(this, "商品" + i + ",原价未填写")
          return
        }
        if (!g.groubaDiscountAmount) {
          util.softTips(this, "商品" + i + ",折扣金额未填写")
          return
        }

      }
    }
    util.softTips(this, "店铺信息,一个月最多更改6次", 3)
  },


  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function() {
    wx.showNavigationBarLoading()
    let that = this

    //#如果缓存显示，用户一直未入驻，则直接进入编辑模式，并提示用户填写店铺商品信息
    if (util.getCache(util.cacheKey.isOpen)) {
      util.softTips(that, "您未入驻，请完善店铺、商品信息", 3);
      util.log("#未入驻，无需登陆")
      return
    }

    // 登录
    wx.login({
      success: resLogin => {
        util.log("#登陆code:" + JSON.stringify(resLogin))
        if (util.getCache(util.cacheKey.userinfo, "system")) {
          util.log("#命中缓存-无需再获取用户设备信息")
        } else {
          util.log("#未命中缓存-获取用户设备信息")
          wx.getSystemInfo({
            success: function(res) {
              util.putCache(util.cacheKey.userinfo, "model", res.model);
              util.putCache(util.cacheKey.userinfo, "system", res.system);
              util.putCache(util.cacheKey.userinfo, "brand", res.brand);
              util.putCache(util.cacheKey.userinfo, "platform", res.platform);
              util.log("#userinfo:" + JSON.stringify(util.getCache(util.cacheKey.userinfo)))
            },
          })
        }

        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        util.reqPost(util.apiHost + "/user/wxLogin4Shop", {
          "appid": "wx71de1973104f41cf",
          "secret": "8dee514b29b84c7640b842e4e2d521aa",
          "jsCode": res.code,
          "grantType": "authorization_code",
        }, function success(data) {
          util.log("#data:" + JSON.stringify(data))
          if (data.retCode == '10000') {
            util.putCache(util.cacheKey.isOpen, "isOpen", true)
            util.putCache(util.cacheKey.userinfo, "wxUnionid", data.unionid)
            util.putCache(util.cacheKey.userinfo, "wxOpenid", data.openid)
            util.softTips(that, data.retMsg, 5)

          } else {
            //已入驻，展示店铺商品信息
            wx.removeStorageSync(util.cacheKey.isOpen)
            this.setData({
              isEdit: false,
            })
          }
        }, function fail() {

        })

      }
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