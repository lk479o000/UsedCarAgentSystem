/**
 * 登录状态检查与跳转
 */
const checkLogin = (options = {}) => {
  const { redirect = false, url = '/pages/login/login' } = options
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

const getStoredUserInfo = () => {
  const raw = wx.getStorageSync('userInfo')
  if (!raw) return null
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch (e) {
      return null
    }
  }
  if (typeof raw === 'object') return raw
  return null
}

const isAdminUser = (userInfo) => {
  if (!userInfo || typeof userInfo !== 'object') return false
  const roleCandidates = [userInfo.role, userInfo.roleId, userInfo.role_id]
  return roleCandidates.some((role) => String(role) === '0')
}

/**
 * 页面登录守卫 mixin
 */
const pageLoginGuard = {
  onShow() {
    checkLogin({ redirect: true })
  },
}

module.exports = {
  checkLogin,
  getStoredUserInfo,
  isAdminUser,
  pageLoginGuard,
}
