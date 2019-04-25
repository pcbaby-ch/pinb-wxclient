/** # 时间工具类 ##################################### */
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
/** # 网络请求工具类 ##################################### */
function reqPost(url, params, success, fail) {
  requestLoading(url, params, "", success, fail)
}

function reqGet(url, success, fail) {
  requestLoading(url, null, "", success, fail)
}

function requestLoading(url, params, message, success, fail) {
  console.log(">>>请求参数:" + JSON.stringify(params))
  wx.showNavigationBarLoading()
  if (!message || message != "") {
    // wx.showLoading({
    //   title: message,
    // })
  }
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
      
      if (message != "") {
        wx.hideLoading()
      }
      if (res.statusCode == 200) {
        success(res.data)
      } else {
        fail()
      }

    },
    fail: function(res) {
      if (message != "") {
        wx.hideLoading()
      }
      fail()
    },
    complete: function(res) {
      console.log(">>>响应数据:" + JSON.stringify(res))
      wx.hideNavigationBarLoading()
    },
  })
}


module.exports = {
  formatTime: formatTime,
  reqPost: reqPost,
  reqGet: reqGet,
}