Page({
  data: {
    userInfo: null,
  },

  onShow() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({ userInfo: JSON.parse(userInfo) })
    }
  },

  logout() {
    wx.showModal({
      title: '提示',
      content: '确认退出登录?',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          wx.removeStorageSync('openid')
          wx.showToast({ title: '已退出', icon: 'success' })
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/index/index' })
          }, 1000)
        }
      },
    })
  },
})
