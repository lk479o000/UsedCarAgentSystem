/**
 * 登录状态检查与跳转
 */
const checkLogin = (options = {}) => {
  const { redirect = true, url = '/pages/login/login' } = options
  const token = wx.getStorageSync('token')
  const userInfo = wx.getStorageSync('userInfo')

  if (!token || !userInfo) {
    if (redirect) {
      wx.redirectTo({ url })
    }
    return false
  }
  return true
}

/**
 * 页面登录守卫 mixin
 */
const pageLoginGuard = {
  onShow() {
    checkLogin()
  },
}

module.exports = {
  checkLogin,
  pageLoginGuard,
}
