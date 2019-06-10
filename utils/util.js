var md5 = require('md5.js')
var base64 = require('base64.js')
var QQMapWX = require('qqmap-wx-jssdk.min.js')
var wxmap = new QQMapWX({
  key: 'R26BZ-U6AKX-ED54W-TYQ2N-RY5OO-HIB2S'
})

//全局-时间工具类 ###########################################################
/** 时间工具类 */
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}
/** 计算结束时间和当前时间的剩余时间差 return{？时？分？秒} */
function getRemainTime(endTime_) {
  endTime_ = (endTime_ + "").replace(/-/g, '/').replace('.0', '')
  let endTime = new Date(endTime_).getTime()
  let nowTime = new Date().getTime()
  log("#endTime:" + endTime + "#nowTime:" + nowTime + "#endTime_:" + endTime_)
  let time = (endTime - nowTime) / 1000;
  if (nowTime - endTime >= 0) {
    return '00时00分00秒'
  }
  // 获取天、时、分、秒
  let day = timeFormat(parseInt(time / (60 * 60 * 24)));
  let hou = timeFormat(parseInt(time / (60 * 60)));
  let min = timeFormat(parseInt(time % (60 * 60) % 3600 / 60));
  let sec = timeFormat(parseInt(time % (60 * 60) % 3600 % 60));
  return hou + '时' + min + '分' + sec + '秒'
}

function timeFormat(t) {
  return t < 10 ? '0' + t : t
}
//全局-网络请求工具类 ###########################################################
/** 带json请求报文体的post网络请求 */
function reqPost(url, params, success, fail) {
  requestLoading(url, params, "", success, fail)
}
/** 不带任何请求报文体的get网络请求 */
function reqGet(url, success, fail) {
  requestLoading(url, null, "", success, fail)
}
/** 解析服务端响应报文，并做业务错误提示
 * args{that,resp}
 * return{false:发生业务错误}
 */
function parseResp(that, resp) {
  log("#开始解析响应报文:" + resp)
  if (!resp.retCode) {
    resp = JSON.parse(resp)
  }
  if (resp.retCode != '10000') {
    that.setData({
      usToast: {
        text: resp.retMsg,
        time: 3
      }
    })
    return false
  }
  return true
}

function requestLoading(url, params, message, successCallback, failCallback) {
  //log(">>>请求参数(包装处理前):" + JSON.stringify(params) + " #url:" + url)
  wx.showNavigationBarLoading()
  if (!message || message != "") {
    // wx.showLoading({
    //   title: message,
    // })
  }
  //#包装处理请求报文{加签、非对称加密等处理}
  params = reqBodyWrap(url, params)
  log(">>>请求参数(包装处理后):" + JSON.stringify(params) + " #url:" + url)
  var reqMethod = "post";
  var reqHeader = {
    'Content-Type': 'application/json'

  }
  if (JSON.stringify(params).length <= 0) {
    reqMethod = "get";
    reqHeader = {
      'content-type': 'application/x-www-form-urlencoded'
    }
  }
  wx.getNetworkType({
    success: function(res) {
      // log("#网络连接情况:" + JSON.stringify(res))
      if (res.networkType == 'none') {
        heavyTips('网络异常', '亲，你的网络异常，请恢复后重试!')
      }
    },
  })
  wx.request({
    url: url,
    data: params,
    header: reqHeader,
    method: reqMethod,
    success: function(res) {
      if (res.statusCode == 200) {
        successCallback(res.data)
      } else {
        if (failCallback)
          failCallback()
        else if (res.errMsg = "request:fail timeout")
          heavyTips('服务繁忙', '亲，活动火爆，请稍后重试!')
        else
          heavyTips('网络异常', '亲，你的网络异常，请恢复后重试!')
      }

    },
    fail: function(res) {
      if (failCallback)
        failCallback()
      else if (res.errMsg = "request:fail timeout")
        heavyTips('服务繁忙', '亲，活动火爆，请稍后重试!')
      else
        heavyTips('网络异常', '亲，你的网络异常，请恢复后重试!')
    },
    complete: function(res) {
      log(">>>响应数据:" + JSON.stringify(res) + " #url:" + url)
      wx.hideNavigationBarLoading()
      if (message != "") {
        wx.hideLoading()
      }
    },
  })
}
/** 针对不同host服务，采用不同的签名、加密机制，包装处理请求报文 */
function reqBodyWrap(url, reqBody) {
  if (url.indexOf("pinb.vip") >= 0) {
    //pinb服务host，报文采用非对称加密
    let base = base64.CusBASE64.encoder(reqBody)
    log("#加密报文：" + base)
  } else if (url.indexOf("api.weixin.qq.com") >= 0) {
    //微信服务host，不包装处理
  } else {
    //未知服务host，不包装处理
  }
  return reqBody
}
let imgMaxSize = 1024 * 1024 /** #1000kb */
/** 图片上传 (resImage是chooseImage组件的资源)
 * return {图片文件名称}}}
 */
function imageUpload(resImage, fileTypePath, that, callBack, compressRate) {
  log("#图片准备上传,#res" + JSON.stringify(resImage));
  //#01图片压缩
  if (resImage.tempFiles[0].size > imgMaxSize) {
    compressRate = compressRate || 60
    log("# 图片大于1M， 开始压缩, #defaultCompressRate: 60, #currentRate: " + compressRate)
    putCache("compressRate", null, compressRate)
    wx.compressImage({
      src: resImage.tempFiles[0].path, // 图片路径
      quality: compressRate || 60, // 压缩质量
      success: resCompressImg => {
        wx.getFileSystemManager().getFileInfo({
          filePath: resCompressImg.tempFilePath, //选择图片返回的相对路径
          // encoding: 'binary', //编码格式
          success: res => {
            log("#压缩后的图片:" + JSON.stringify(res))
            if (res.size > imgMaxSize) {
              let compressRate = getCache("compressRate")
              if (compressRate && compressRate >= 1) {
                compressRate = (compressRate / 2)
                log("#图片上传失败,开始重试,#compressRate:" + compressRate)
                imageUpload(resImage, fileTypePath, that, callBack, compressRate)
              } else {
                log("#图片上传失败,重试超限，#compressRate:" + compressRate)
                return
              }
            } else {
              log("#图片压缩成小于1M，开始上传")
              fileUpload(resCompressImg.tempFilePath, fileTypePath, that, callBack)
            }
          }
        })
      },
      fail() {
        log("#图片压缩失败")
      }
    })
  } else {
    log("#图片小于1M，不压缩，原图上传")
    fileUpload(resImage.tempFiles[0].path, fileTypePath, that, callBack)
  }

}
/** 计算文件md5并上传 */
function fileUpload(resImgPath, fileTypePath, that, callBack, resImage) {
  let imageMd5 = "'图片md5缺省值'"
  wx.getFileSystemManager().readFile({
    filePath: resImgPath, //选择图片返回的相对路径
    // encoding: 'binary', //编码格式
    success: res => {
      var spark = new md5.ArrayBuffer();
      spark.append(res.data);
      imageMd5 = spark.end(false);

      wx.getNetworkType({
        success: function(res) {
          // log("#网络连接情况:" + JSON.stringify(res))
          if (res.networkType == 'none') {
            heavyTips('网络异常', '亲，你的网络异常，请恢复后重试!')
          }
        },
      })
      wx.uploadFile({
        url: apiHost + '/fileUpload',
        filePath: resImgPath,
        name: 'file',
        formData: {
          fileMd5: imageMd5,
          fileTypePath: fileTypePath
        },
        success(res) {
          let data
          try {
            data = JSON.parse(res.data)
          } catch (error) {
            data = null
          }
          if (!data || data.retCode != '10000') {
            log("#图片服务端上传失败" + JSON.stringify(data))
          } else {
            log("#图片上传完成,#res" + JSON.stringify(data))
            callBack(data.data)
          }
        }
      })
    }
  })
}
//全局-缓存操作工具类 ###########################################################
const cacheVersionsuffix = '20190518'
/** 提取缓存or缓存对象属性值(同步) */
function getCache(key_, prop) {
  // key_ = key_ + cacheVersionsuffix //解决客户端版本迭代，旧版本脏缓存问题
  let cache = wx.getStorageSync(key_)
  if (prop && Object.prototype.toString.call(prop) === '[object String]') {
    if (Object.prototype.toString.call(cache) === '[object Object]') {
      // log("#缓存get完成，#key_:" + key_ + "#prop:" + prop + "#value:" + cache[prop])
      return cache[prop]
    } else {
      log("######error缓存不是对象，不能提取属性值")
    }
  } else {
    // log("#缓存get完成，#key_:" + key_ + "#prop:" + prop + "#value:" + JSON.stringify(cache))
    return cache;
  }
}
/** 提取缓存or缓存对象属性值(异步) */
function getCacheAsyn(key_, prop) {
  // key_ = key_ + cacheVersionsuffix //解决客户端版本迭代，旧版本脏缓存问题
  let cache = wx.getStorageSync(key_)
  if (prop && Object.prototype.toString.call(prop) === '[object String]') {
    if (Object.prototype.toString.call(cache) === '[object Object]') {
      // log("#缓存是对象，提取属性值")
      return cache[prop]
    } else {
      log("######error缓存不是对象，不能提取属性值")
    }
  } else {
    return cache;
  }
}
/** 直接缓存，已有同key缓存直接覆盖 */
function setCache(key_, value) {
  // key_ = key_ + cacheVersionsuffix //解决客户端版本迭代，旧版本脏缓存问题
  if (value) {
    wx.setStorageSync(key_, value);
  } else {
    wx.removeStorage({
      key: key_,
      success: function(res) {},
    })
  }
  // log("#缓存完成,#key:" + key_ + ",#value:" + value)
}

function setCacheAsyn(key_, value) {
  // key_ = key_ + cacheVersionsuffix //解决客户端版本迭代，旧版本脏缓存问题
  if (value) {
    wx.setStorage(key_, value);
  } else {
    wx.removeStorage({
      key: key_,
      success: function(res) {},
    })
  }
  // log("#缓存完成,#key:" + key_ + ",#value:" + value)
}
/**
 * 往对象类型缓存加属性；往数组类型缓存加元素{单值、对象、数组}
 * 如果key_下的旧缓存是不存在，则初始化
 */
function putCache(key_, prop, value) {
  let cache = getCache(key_, null)
  let cacheArray = [];
  if (prop && Object.prototype.toString.call(prop) != '[object String]') {
    throw new Error("#error缓存属性必须是string类型")
  }

  if (!cache) {
    // log(">>>缓存put-初始化缓存")
    if (prop) {
      cache = {}
      cache[prop] = value
      setCache(key_, cache)
    } else {
      if (Object.prototype.toString.call(value) === '[object Object]') {
        putObject2Cache(key_, value)
      } else {
        // throw new Error("#error没有指定prop时，不能push一个单值或数组到缓存对象中")
        setCache(key_, value)
      }
    }
    return
  }
  if (Object.prototype.toString.call(cache) === '[object Array]') {
    // log(">>>缓存put-数组缓存-添加元素{单值、对象、数组}")
    cacheArray = cache;
    cacheArray.push(value)
    setCache(key_, cacheArray)
  } else if (Object.prototype.toString.call(cache) === '[object Object]') {
    if (prop) { //#如果prop不为空
      // log(">>>缓存put-对象缓存-添加属性")
      cache[prop] = value
      setCache(key_, cache)
    } else { //#如果prop为空，则将待push的对象的所有属性全部push到缓存对象中
      // log(">>>缓存put-对象缓存-开始合并对象到缓存对象中")
      putObject2Cache(key_, value)
    }
  } else {
    // throw new Error("#error没有指定prop时，不能push一个单值或数组到缓存对象中")
    setCache(key_, value)
  }
}
/** 将待push的对象value的所有属性全部push到缓存对象cache中 */
function putObject2Cache(key_, value) {
  let cache = getCache(key_)
  if (!cache) {
    cache = {}
  }
  if (Object.prototype.toString.call(value) === '[object Object]') {
    for (var p in value) {
      if (typeof(value[p]) == "function") {
        throw "#error对象中包含方法，不能push操作"
      } else {
        cache[p] = value[p]; //#缓存中如果以及存在属性，则替换
      }
    }
    setCache(key_, cache)
  } else {
    // throw new Error("#error没有指定prop时，不能push一个单值或数组到缓存对象中")
    setCache(key_, value)
  }
}
/** 统一日志，如果是产线即关闭日志 */
function log(logText) {
  // TODO 待获取调用函数行号
  if (apiHost.indexOf("api.pinb.vip") >= 0) {
    //产线环境，不打印日志
  } else if (apiHost.indexOf("apitest.pinb.vip") >= 0) {
    //测试环境，打印日志
    console.log(logText + " >>" + formatTime(new Date()))
  } else if (apiHost.indexOf("127.0.0.1") >= 0 || apiHost.indexOf("localhost") >= 0) {
    //本地环境，打印日志
    console.log(logText + " >>" + formatTime(new Date()))
  }
}

//其它-工具类 ##############################################################

/** 微信异步方法，同步化封装 */
function wxPromise(fn) {
  return function(obj = {}) {
    return new Promise((resole, reject) => {
      obj.success = function(res) {
        resole(res)
      }

      obj.fail = function(res) {
        reject(res)
      }

      fn(obj)
    })
  }
}
/** 轻提示 */
function softTips(that, text_, time_) {
  that.setData({
    usToast: {
      text: text_,
      time: time_ || 1,
    }
  })
}
/** 重提示 */
function heavyTips(tile_, text_) {
  wx.showModal({
    title: tile_,
    content: text_,
  })
}
/** 统一分页 - 加载初始页面数据 args{页面this,业务加载数据方法,每页行数(缺省10)}*/
function pageInitData(that, loadMethod, pageRows) {
  let methodName = loadMethod.getName() + ''
  methodName = methodName.substring(methodName.indexOf(' ') + 1, methodName.length)
  that.setData({
    isLoadding: true,
    isLoadEnd: false,
  })
  let pageCacheKey = "page_" + methodName
  putCache(pageCacheKey, 'page', 1)
  putCache(pageCacheKey, 'rows', pageRows || 10)
  log("#当前分页业务为:" + pageCacheKey + "#当前页:1")
  loadMethod(1, pageRows || 10)
}

/** 统一分页 -加载下一页数据 args{页面this,业务加载数据方法}*/
function pageMoreData(that, loadMethod) {
  that.setData({
    isLoadding: true,
  })
  let methodName = loadMethod.getName() + ''
  methodName = methodName.substring(methodName.indexOf(' ') + 1, methodName.length)
  let pageCacheKey = "page_" + methodName
  let page = getCache(pageCacheKey, 'page') + 1
  let rows = getCache(pageCacheKey, 'rows')
  putCache(pageCacheKey, 'page', page)
  log("#当前分页业务为:" + pageCacheKey + "#当前页:" + page)
  loadMethod(page, rows)
}
/** 获取传入方法的方法名称 */
Function.prototype.getName = function() {
  return this.name || this.toString().match(/function\s*([^(]*)\(/)[1]
}
/** 获取2个经纬度之间的直线距离 args{lat1,lng1,lat2,lng2} return{距离}}*/
function getDistance(lat1, lng1, lat2, lng2) {
  lat1 = lat1 || 0;
  lng1 = lng1 || 0;
  lat2 = lat2 || 0;
  lng2 = lng2 || 0;
  if (lat1 == 0 || lng1 == 0 || lat2 == 0 || lng2 == 0) {
    log("#lat1:" + lat1 + "lng1:" + lng1 + "lat2:" + lat2 + "lng2:" + lng2)
    return '请选位置'
  }

  var rad1 = lat1 * Math.PI / 180.0;
  var rad2 = lat2 * Math.PI / 180.0;
  var a = rad1 - rad2;
  var b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0;
  var r = 6378137;
  var distance = r * 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(rad1) * Math.cos(rad2) * Math.pow(Math.sin(b / 2), 2)));
  // log("#lat1:" + lat1 + "lng1:" + lng1 + "lat2:" + lat2 + "lng2:" + lng2 + "#计算距离为:" + distance + "#" + distance / 1000.0)
  if (distance / 1000.0 >= 1) {
    // log("#计算距离为-千米:" + (distance / 1000.0).toFixed(1) + 'km')
    return (distance / 1000.0).toFixed(1) + 'km'
  } else {
    // log("#计算距离为-米:" + distance.toFixed(0) + 'm')
    return distance.toFixed(0) + 'm'
  }
}
/** 获取经纬度所在省市 */
function getCity(latitude, longitude, key, callBack4GetCity) {
  wxmap.reverseGeocoder({
    location: {
      latitude: latitude,
      longitude: longitude
    },
    success: res => {
      log("#省市解析成功:" + JSON.stringify(res))
      putCache(key, 'latitude', latitude)
      putCache(key, 'longitude', longitude)
      putCache(key, 'province', res.result.address_component.province)
      putCache(key, 'city', res.result.address_component.city)
      callBack4GetCity()
    },
    fail: res => {
      log("#省市解析失败:" + JSON.stringify(res))
    }
  })
}
/** 获取地图位置 4 用户 */
function chooseLoc4User(that, callBack4GetCity) {
  wx.chooseLocation({
    success(res) {
      log("#地址选择成功:" + JSON.stringify(res))
      putCache(cacheKey.userinfo, "address", res.name)
      putCache(cacheKey.userinfo, "latitude", res.latitude)
      putCache(cacheKey.userinfo, "longitude", res.longitude)
      getCity(res.latitude, res.longitude, cacheKey.userinfo, callBack4GetCity)
      log("#userinfo:" + JSON.stringify(getCache(cacheKey.userinfo)))
      that.setData({
        searchAddress: res.name,
      })
      putCache("page_getNearGrouba", "page", 1) //重置分页为起始页
    },
    fail(res) {
      log("#地址选择失败:" + JSON.stringify(res))
      if (res.errMsg == 'chooseLocation:fail cancel') {
        //如果用户取消选择地址，则不弹出授权列表，
        return
      }
      wx.showModal({
        title: '需要授权',
        content: '请开启位置权限后，重新选择地址',
        success(res) {
          if (res.confirm) {
            wx.openSetting({
              success(data) {
                that.chooseLoc()
              }
            })
          }
        }
      })
    }
  })
}

//统一业务封装 ###########################################################
/** 开团/参团/分享button */
function onShareAppMessageA(that, e) {
  log("#分享防止冒泡方法hack,#e:" + JSON.stringify(e))
  let index = e.detail.target.dataset.index
  var formId = e.detail.formId
  let tapGrouba = index >= 0 ? that.data.pageArray[index] : that.data.shareGoods
  log("#操作商品:" + JSON.stringify(tapGrouba))
  if (tapGrouba.shareOrder) {
    //已开团，只能参团
    if (tapGrouba.isJoined && tapGrouba.isJoined == true) {
      log("#已开团，纯分享")
    } else {
      orderJoin(that, tapGrouba.shareOrder, tapGrouba.shareLeader, formId)
    }
  } else {
    //未开团
    orderOpen(that, tapGrouba, formId)
  }
  // log("#拼团活动商品:" + JSON.stringify(tapGrouba))
}
/** 纯分享计数 */
function shareCount(that, groubaTrace) {
  reqPost(apiHost + "/groubActivity/share", {
    groubaTrace: groubaTrace,
  }, resp => {
    if (parseResp(that, resp)) {
      log("#分享成功:" + resp)
    }
  })
}

/** 开团服务请求 args{tapGrouba:开团商品信息}*/
function orderOpen(that, tapGrouba, formId) {
  reqPost(apiHost + "/groubaOrder/orderOpen", {
    refGroubTrace: tapGrouba.refGroubTrace,
    refGroubaTrace: tapGrouba.groubaTrace,
    orderExpiredTime: tapGrouba.groubaActiveMinute,
    refUserWxUnionid: getCache(cacheKey.userinfo, "wxUnionid"),
    refUserWxOpenid: getCache(cacheKey.userinfo, "wxOpenid"),
    refUserImg: getCache(cacheKey.userinfo, "avatarUrl"),
    goodsName: tapGrouba.goodsName,
    goodsImg: tapGrouba.goodsImg,
    goodsPrice: tapGrouba.goodsPrice,
    groubaDiscountAmount: tapGrouba.groubaDiscountAmount,
    groubaIsnew: tapGrouba.groubaIsnew,
    formId: formId,
  }, resp => {
    if (parseResp(that, resp)) {
      // softTips(this, "开团成功")
      that.onShow()
    }
  })
}
/** 参团服务请求 args{orderTrace:原团订单号,refUserWxUnionid:原团团长}*/
function orderJoin(that, orderTrace, orderLeader, formId) {
  reqPost(apiHost + "/groubaOrder/orderJoin", {
    orderTrace: orderTrace,
    leader: orderLeader,
    refUserWxUnionid: getCache(cacheKey.userinfo, "wxUnionid"),
    refUserWxOpenid: getCache(cacheKey.userinfo, "wxOpenid"),
    refUserImg: getCache(cacheKey.userinfo, "avatarUrl"),
    formId: formId,
  }, resp => {
    if (parseResp(that, resp)) {
      // softTips(this, "参团成功")
      that.onShow()
    }
  })
}
/** 获取店铺基本信息+商品信息+分享订单头像信息 */
function getGroubShareOrder(that, groubTrace, orderTrace, orderLeader) {
  reqPost(apiHost + "/groupBar/selectOneShare", {
    groubTrace: groubTrace,
    orderTrace: orderTrace,
    orderLeader: orderLeader,
    refUserWxUnionid: getCache(cacheKey.userinfo, 'wxUnionid'),
  }, resp => {
    if (parseResp(that, resp)) {
      let curLatitude = getCache(cacheKey.userinfo, 'latitude')
      let curLongitude = getCache(cacheKey.userinfo, 'longitude')
      resp.data.groubInfo.groubImgView = apiHost + "/images/shopImg/" + resp.data.groubInfo.groubImg
      if (resp.data.shareGoods) { //如果存在分享商品
        resp.data.shareGoods.goodsImgView = apiHost + "/images/goodsImg/" + resp.data.shareGoods.goodsImg
        resp.data.shareGoods['distance'] = getDistance(curLatitude, curLongitude, resp.data.shareGoods.latitude, resp.data.shareGoods.longitude)
        resp.data.shareGoods['orderExpiredTimeRemain'] = getRemainTime(resp.data.shareGoods.orderExpiredTime)
        resp.data.shareGoods.userImgs = resp.data.shareGoods.userImgs.split(",")
        resp.data.shareGoods.ordersStatus = resp.data.shareGoods.ordersStatus.split(",")
      }
      for (var i in resp.data.goodsList) {
        let item = resp.data.goodsList[i]
        resp.data.goodsList[i]['goodsImgView'] = apiHost + "/images/goodsImg/" + item.goodsImg
        resp.data.goodsList[i]['distance'] = getDistance(curLatitude, curLongitude, item.latitude, item.longitude)
        resp.data.goodsList[i]['orderExpiredTimeRemain'] = getRemainTime(item.orderExpiredTime)
        if (item.userImgs) { //如果存在订单头像信息
          resp.data.goodsList[i].userImgs = item.userImgs.split(",")
          resp.data.goodsList[i].ordersStatus = item.ordersStatus.split(",")
        }
      }
      that.setData({
        groub: resp.data.groubInfo,
        pageArray: resp.data.goodsList,
        shareGoods: resp.data.shareGoods,
      })
      // countDown(that, resp.data.goodsList)
      log("#店铺or分享活动商品-数据加载-完成")
    } else {
      log("#店铺or分享活动商品-数据加载-失败")
    }
  })
}

/** 倒计时 */
function countDown(that, pageArray) {
  for (let i in pageArray) {
    let item = pageArray[i]
    if (item.orderExpiredTime) {
      log("#countDown-pageArray[i]:" + JSON.stringify(item))
      item.orderExpiredTimeRemain = getRemainTime(item.orderExpiredTime)
    }
  }
  let shareGoods = that.data.shareGoods
  shareGoods.orderExpiredTimeRemain = getRemainTime(item.orderExpiredTime)
  that.setData({
    pageArray,
    shareGoods,
  })
  // setTimeout(countDown(that, pageArray), 1000)
}



//全局-常量、变量 ###########################################################
const apiHost = "https://apitest.pinb.vip/pinb-service"
//https://apitest.pinb.vip/pinb-service
//http://127.0.0.1:9660/pinb-service
const appid = 'wx71de1973104f41cf'
const secret = '8dee514b29b84c7640b842e4e2d521aa'

const cacheKey = {
  cacheTimeout: 'cacheTimeout',

  userinfo: 'userinfo',
  isOpen: "isOpen",
  groubaTrace: 'groubaTrace',
  groubInfo: "groubInfo",
  goodsList: 'goodsList',
}



module.exports = {
  formatTime: formatTime,
  getRemainTime: getRemainTime,
  reqPost: reqPost,
  reqGet: reqGet,
  parseResp: parseResp,
  imageUpload: imageUpload,

  getCache: getCache,
  setCache: setCache,
  putCache: putCache,

  log: log,
  pageInitData: pageInitData,
  pageMoreData: pageMoreData,
  getDistance: getDistance,

  softTips: softTips,
  heavyTips: heavyTips,
  getCity: getCity,
  chooseLoc4User: chooseLoc4User,

  onShareAppMessageA: onShareAppMessageA,
  shareCount: shareCount,
  orderOpen: orderOpen,
  orderJoin: orderJoin,
  getGroubShareOrder: getGroubShareOrder,

  /** api服务host地址 https://apitest.pinb.vip/pinb-service */
  apiHost: apiHost,
  appid: appid,
  secret: secret,
  /** 全局缓存key，防止缓存key冲突 */
  cacheKey: cacheKey,


}