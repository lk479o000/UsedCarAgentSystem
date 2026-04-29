const { checkLogin } = require('./utils/auth')

App({
  globalData: {
    userInfo: null,
    token: null,
    // 线上：Nginx 对外提供 https://sjmcpitt.com/api/v1/*
    baseUrl: 'http://localhost:8902',
    // baseUrl: 'https://sjmcpitt.com',
  },
  onLaunch() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
    }
  },
})
