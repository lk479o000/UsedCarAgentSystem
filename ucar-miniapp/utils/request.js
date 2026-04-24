const BASE_URL = 'https://your-api-domain.com/api/v1'

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
      success: (res) => {
        if (res.statusCode === 200) {
          if (res.data.code === 0) {
            resolve(res.data)
          } else if (res.data.code === 2) {
            wx.removeStorageSync('token')
            wx.showToast({ title: '登录已过期', icon: 'none' })
            reject(res.data)
          } else {
            wx.showToast({ title: res.data.message || '请求失败', icon: 'none' })
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
