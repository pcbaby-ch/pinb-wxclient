//app.js
App({
    onLaunch: function () {


    // 登录
    wx.login({
      success: res => {
        console.log(res)
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
    // 获取用户信息
    wx.getSetting({
      success: res => {
        console.log(res)
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },
  globalData: {
    userInfo: null
  },

  initAuth: function () {
    //** 集中用户授权，方便后续接口调用体验 */
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.userInfo', 'scope.userLocation', 'scope.address']) {
          wx.authorize({
            scope: 'scope.userInfo',
            success() {
              console.log("用户基本信息授权成功");
            }
          })
          wx.authorize({
            scope: 'scope.userLocation',
            success() {
              console.log("用户地理位置授权成功");
            }
          })
          wx.authorize({
            scope: 'scope.address',
            success() {
              console.log("用户地址授权成功");
            }
          })
        }
      }
    })
  },

}

)