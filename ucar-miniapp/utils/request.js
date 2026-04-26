const app = getApp()
const BASE_URL = `${app.globalData.baseUrl}/api/v1`
const { getErrorMessage, getMessageType } = require('./errorCode')

const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')
    wx.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200) {
          if (res.data.code === 0) {
            resolve(res.data)
          } else if (res.data.code === 2) {
            wx.removeStorageSync('token')
            wx.removeStorageSync('userInfo')
            wx.showToast({ title: getErrorMessage(res.data.code), icon: 'none' })
            // 跳转到登录页面
            wx.navigateTo({ url: '/pages/login/login' })
            reject(res.data)
          } else {
            wx.showToast({ title: getErrorMessage(res.data.code, res.data.message), icon: 'none' })
            reject(res.data)
          }
        } else {
          wx.showToast({ title: '网络错误', icon: 'none' })
          reject(res)
        }
      },
      fail: (err) => {
        wx.showToast({ title: '网络错误', icon: 'none' })
        reject(err)
      },
    })
  })
}

module.exports = {
  get: (url, params = {}) => request({ url, method: 'GET', data: params }),
  post: (url, data = {}) => request({ url, method: 'POST', data }),
  put: (url, data = {}) => request({ url, method: 'PUT', data }),
  del: (url) => request({ url, method: 'DELETE' }),
}
