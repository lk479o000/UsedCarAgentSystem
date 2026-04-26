const { checkLogin } = require('./utils/auth')

App({
  globalData: {
    userInfo: null,
    token: null,
    baseUrl: 'http://localhost:8902',
  },
  onLaunch() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
    }

    // 全局检查登录状态，未登录则跳转到登录页（非 tabBar 页面）
    const pages = getCurrentPages()
    if (pages.length === 0) {
      checkLogin()
    }
  },
})
