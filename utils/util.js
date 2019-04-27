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
//全局-网络请求工具类 ###########################################################
/** 带json请求报文体的post网络请求 */
function reqPost(url, params, success, fail) {
  requestLoading(url, params, "", success, fail)
}
/** 不带任何请求报文体的get网络请求 */
function reqGet(url, success, fail) {
  requestLoading(url, null, "", success, fail)
}

function requestLoading(url, params, message, successCallback, failCallback) {
  log(">>>请求参数(包装处理前):" + JSON.stringify(params) + " #url:" + url)
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

  wx.request({
    url: url,
    data: params,
    header: reqHeader,
    method: reqMethod,
    success: function(res) {


      if (res.statusCode == 200) {
        successCallback(res.data)
      } else {
        failCallback()
      }

    },
    fail: function(res) {
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
//全局-缓存操作工具类 ###########################################################
function getCache(key_) {
  return wx.getStorageSync(key_);
}

function getCacheAsyn(key_) {
  return wx.getStorage(key_);
}

function setCache(key_, value) {
  wx.setStorageSync(key_, value);
}

function setCacheAsyn(key_, value) {
  wx.setStorage(key_, value);
}
/**
 * 往已缓存对象加属性；往已缓存数组加对象
 * 如果key_缓存对应是null，则初始化为prop:value的对象
 */
function putCache(key_, prop, value) {
  let cache = getCache(key_)
  let cacheArray = [];
  if (!cache) {
    log(">>>缓存put-初始化")
    cache = {}
    cache[prop] = value
    setCache(key_, cache)
  }
  if (Object.prototype.toString.call(cache) === '[object Array]') {
    log(">>>缓存put-数组添加对象")
    cacheArray = cache;
    cacheArray.push(value)
    setCache(key_, cacheArray)
  } else {
    log(">>>缓存put-对象添加属性")
    cache[prop] = value
    setCache(key_, cache)
  }

}
/**
 * 往已缓存对象加属性；往已缓存数组加对象（异步）
 * 如果key_缓存对应是null，则初始化为prop:value的对象
 */
function putCacheAsyn(key_, prop, value) {
  let cache = getCacheAsyn(key_)
  let cacheArray = [];
  if (!cache) {
    log(">>>缓存put-初始化")
    cache = {}
    cache[prop] = value
    setCacheAsyn(key_, cache)
  }
  if (Object.prototype.toString.call(cache) === '[object Array]') {
    log(">>>缓存put-数组添加对象")
    cacheArray = cache;
    cacheArray.push(value)
    setCacheAsyn(key_, cacheArray)
  } else {
    log(">>>缓存put-对象添加属性")
    cache[prop] = value
    setCacheAsyn(key_, cache)
  }

}
/** 统一日志，如果是产线即关闭日志 */
function log(logText) {
  if (apiHost.indexOf("api.pinb.vip") >= 0) {
    //产线环境，不打印日志
  } else if (apiHost.indexOf("apitest.pinb.vip") >= 0) {
    //测试环境，不打印日志
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


//全局-常量、变量 ###########################################################
const apiHost = "http://127.0.0.1:9660/pinb-service"

const cacheKey = {
  userinfo: 'userinfo',
}


module.exports = {
  formatTime: formatTime,
  reqPost: reqPost,
  reqGet: reqGet,
  getCache: getCache,
  getCacheAsyn: getCacheAsyn,
  setCache: setCache,
  setCacheAsyn: setCacheAsyn,
  putCache: putCache,
  putCacheAsyn: putCacheAsyn,
  log: log,



  /** api服务host地址 https://apitest.pinb.vip/pinb-service */
  apiHost: apiHost,
  /** 全局缓存key，防止缓存key冲突 */
  cacheKey: cacheKey,

}