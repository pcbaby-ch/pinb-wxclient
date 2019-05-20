var md5 = require('md5.js')

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
  let endTime = new Date(endTime_).getTime()
  let nowTime = new Date().getTime()
  log("#endTime:" + endTime + "#nowTime:" + nowTime)
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
      }

    },
    fail: function(res) {
      if (failCallback)
        failCallback()
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
/** 图片上传 (resImage是chooseImage组件的资源)
 * return {图片文件名称}}}
 */
function imageUpload(resImage, that, callBack, compressRate) {
  log("#图片准备上传,#res" + JSON.stringify(resImage));
  //#01图片压缩
  if (resImage.tempFiles[0].size > 1024 * 1024 / 10) {
    compressRate = compressRate || 60
    log("# 图片大于1M， 开始压缩, #defaultCompressRate: 60, #currentRate: " + compressRate)
    putCache("compressRate", null, compressRate)
    wx.compressImage({
      src: resImage.tempFiles[0].path, // 图片路径
      quality: compressRate || 60, // 压缩质量
      success: resCompressImg => {
        fileUpload(resCompressImg.tempFilePath, that, callBack, resImage)
      },
      fail() {
        log("#图片压缩失败")
      }
    })
  } else {
    log("#图片小于1M，不压缩，原图上传")
    fileUpload(resImage.tempFiles[0].path, that, callBack)
  }

}
/** 计算文件md5并上传 */
function fileUpload(resImgPath, that, callBack, resImage) {
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
          fileMd5: imageMd5
        },
        success(res) {
          let data
          try {
            data = JSON.parse(res.data)
          } catch (error) {
            data = null
          }
          if (!data || data.retCode != '10000') {
            let compressRate = getCache("compressRate")
            log("#图片上传失败,开始重试,#compressRate:" + compressRate)
            if (compressRate && compressRate >= 1) {
              compressRate = (compressRate / 2)
              log("#图片上传失败,开始重试,#compressRate:" + compressRate)
              imageUpload(resImage, that, callBack, compressRate)
            } else {
              log("#图片上传失败,重试超限，最终放弃" + "#resUpload:" + data)
              return
            }
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
  key_ = key_ + cacheVersionsuffix //解决客户端版本迭代，旧版本脏缓存问题
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
  key_ = key_ + cacheVersionsuffix //解决客户端版本迭代，旧版本脏缓存问题
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
  key_ = key_ + cacheVersionsuffix //解决客户端版本迭代，旧版本脏缓存问题
  wx.setStorageSync(key_, value);
  // log("#缓存完成,#key:" + key_ + ",#value:" + value)
}

function setCacheAsyn(key_, value) {
  key_ = key_ + cacheVersionsuffix //解决客户端版本迭代，旧版本脏缓存问题
  wx.setStorage(key_, value);
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
/** 针对不同host服务，采用不同的签名、加密机制，包装处理请求报文 */
function reqBodyWrap(url, reqBody) {
  if (url.indexOf("api.pinb.vip") >= 0) {
    //pinb服务host，报文采用非对称加密

  } else if (url.indexOf("api.weixin.qq.com") >= 0) {
    //微信服务host，不包装处理
  } else {
    //未知服务host，不包装处理
  }
  return reqBody
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

//统一业务封装 ###########################################################





//全局-常量、变量 ###########################################################
const apiHost = "https://apitest.pinb.vip/pinb-service"
//https://apitest.pinb.vip/pinb-service
//http://127.0.0.1:9660/pinb-service

const cacheKey = {
  cacheTimeout: 'cacheTimeout',

  userinfo: 'userinfo',
  isOpen: "isOpen",
  groubaTrace: 'groubaTrace',
  groubInfo: "groubInfo",
  goodsList: 'goodsList',
  toPageParams: 'toPageParams'
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

  /** api服务host地址 https://apitest.pinb.vip/pinb-service */
  apiHost: apiHost,
  /** 全局缓存key，防止缓存key冲突 */
  cacheKey: cacheKey,


}