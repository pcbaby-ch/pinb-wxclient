var md5 = require('md5.js')
var Promise = require('bluebird.min.js')

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
  //添加请求公参
  params[cacheKey.userinfo]=getCache(cacheKey.userinfo)
  requestLoading(url, params, "", success, fail)
}
/** 不带任何请求报文体的get网络请求 */
function reqGet(url, success, fail) {
  requestLoading(url, null, "", success, fail)
}
/** 解析服务端响应报文，并做业务错误提示 */
function respParse(resp, This) {
  log("#开始解析响应报文:" + resp)
  if (!resp.retCode) {
    resp = JSON.parse(resp)
  }
  if (resp.retCode != '10000') {
    This.setData({
      usToast: {
        text: resp.retMsg,
        time: 3
      }
    })
  }
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
/** 图片上传 (resImage是chooseImage组件的资源)
 * return {图片文件名称}}}
 */
function imageUpload(resImage, This, callBack) {
  //#计算文件md5
  let imageMd5 = "'图片md5缺省值'"
  wx.getFileSystemManager().readFile({
    filePath: resImage.tempFilePaths[0], //选择图片返回的相对路径
    // encoding: 'binary', //编码格式
    success: res => {
      //成功的回调
      var spark = new md5.ArrayBuffer();
      spark.append(res.data);
      imageMd5 = spark.end(false);
      log("#图片md5:" + imageMd5)
      log("#图片准备上传,#resImage" + JSON.stringify(resImage) + "#res" + JSON.stringify(res));
      wx.uploadFile({
        url: apiHost + '/fileUpload',
        filePath: resImage.tempFilePaths[0],
        name: 'file',
        formData: {
          fileMd5: imageMd5
        },
        success(res) {
          //#未入驻，则提示用户完善店铺商品信息
          respParse(res.data, This)
          log("#图片上传完成,#res" + JSON.stringify(res) + "#imageMd5:" + imageMd5)
          callBack(imageMd5)
        }
      })
    }
  })
}
//全局-缓存操作工具类 ###########################################################

/** 提取缓存or缓存对象属性值(同步) */
function getCache(key_, prop) {
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
/** 提取缓存or缓存对象属性值(异步) */
function getCacheAsyn(key_, prop) {
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

function setCache(key_, value) {
  wx.setStorageSync(key_, value);
}

function setCacheAsyn(key_, value) {
  wx.setStorage(key_, value);
}
/**
 * 往对象类型缓存加属性；往数组类型缓存加元素{单值、对象、数组}
 * 如果key_下的旧缓存是不存在，则初始化
 */
function putCache(key_, prop, value) {
  let cache = getCache(key_, null)
  let cacheArray = [];
  if (prop && Object.prototype.toString.call(prop) != '[object String]') {
    log("###error 缓存属性必须是string类型")
    throw "#error缓存属性必须是string类型"
  }
  if (!cache) {
    // log(">>>缓存put-初始化缓存")
    if (prop) {
      cache = {}
      cache[prop] = value
      setCache(key_, cache)
      return
    } else {
      if (Object.prototype.toString.call(value) === '[object Object]') {
        putObject2Cache(key_, value)
        return
      } else {
        log("###error没有指定prop时，不能push一个单值或数组到缓存对象中")
        throw new Error("#error没有指定prop时，不能push一个单值或数组到缓存对象中")
      }
    }
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
    log("###error单值缓存无法添加元素")
    throw new Error("#error缓存put-单值缓存无法添加元素")
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
        log("###error 对象中包含方法，不能push操作")
        throw "#error对象中包含方法，不能push操作"
      } else {
        cache[p] = value[p]; //#缓存中如果以及存在属性，则替换
      }
    }
    setCache(key_, cache)
  } else {
    log("###error没有指定prop时，不能push一个单值或数组到缓存对象中")
    throw new Error("#error没有指定prop时，不能push一个单值或数组到缓存对象中")
  }
}
/** 统一日志，如果是产线即关闭日志 */
function log(logText) {
  // TODO 待获取调用函数行号
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
      time: time_||1,
    }
  })
}


//全局-常量、变量 ###########################################################
const apiHost = "http://127.0.0.1:9660/pinb-service"

const cacheKey = {
  userinfo: 'userinfo',
  isOpen: "is_oisOpenpen",
  groubinfo: "groubinfo",
  goodsinfo: 'goodsinfo',
}



module.exports = {
  formatTime: formatTime,
  reqPost: reqPost,
  reqGet: reqGet,
  respParse: respParse,
  imageUpload: imageUpload,

  getCache: getCache,
  putCache: putCache,

  log: log,


  wxPromise: wxPromise,
  softTips: softTips,

  /** api服务host地址 https://apitest.pinb.vip/pinb-service */
  apiHost: apiHost,
  /** 全局缓存key，防止缓存key冲突 */
  cacheKey: cacheKey,


}