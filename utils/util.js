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
  this.requestLoading(url, params, "", success, fail)
}
function reqGet(url, success, fail) {
  this.requestLoading(url, null, "", success, fail)
}

function requestLoading(url, params, message, success, fail) {
  console.log("#>>>请求参数:" + params)
  wx.showNavigationBarLoading()
  if (!message||message != "") {
    wx.showLoading({
      title: message,
    })
  }
  var reqMethod = "post";
  var reqHeader = {
    'content-type': 'application/x-www-form-urlencoded'
  }
  if (JSON.stringify(params).length <= 0) {
    reqMethod = "get";
    reqHeader = {
      'Content-Type': 'application/json'
    }
  }

  wx.request({
    url: url,
    data: params,
    header: reqHeader,
    method: reqMethod,
    success: function(res) {
      //console.log(res.data)
      wx.hideNavigationBarLoading()
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
      wx.hideNavigationBarLoading()
      if (message != "") {
        wx.hideLoading()
      }
      fail()
    },
    complete: function(res) {

    },
  })
}
module.exports = {
  request: request,
  requestLoading: requestLoading
}

function doGet() {

}


module.exports = {
  formatTime: formatTime,
  reqPost: reqPost,
  reqGet: reqGet,
}