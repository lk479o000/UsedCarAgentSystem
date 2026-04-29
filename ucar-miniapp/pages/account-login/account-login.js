const api = require('../../utils/api')

Page({
  data: {
    loading: false,
    username: '',
    password: '',
    captcha: '',
    captchaId: '',
    captchaImage: '',
  },

  onLoad() {
    this.checkLoginStatus()
    this.refreshCaptcha()
  },

  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    if (token && userInfo) {
      wx.switchTab({ url: '/pages/index/index' })
    }
  },

  async refreshCaptcha() {
    try {
      const res = await api.getCaptcha()
      if (res.code === 0 && res.data) {
        this.setData({
          captchaId: res.data.captchaId,
          captchaImage: res.data.captchaImage,
          captcha: '',
        })
      }
    } catch (e) {}
  },

  onUsernameInput(e) { this.setData({ username: e.detail.value }) },
  onPasswordInput(e) { this.setData({ password: e.detail.value }) },
  onCaptchaInput(e) { this.setData({ captcha: e.detail.value }) },

  async onAccountLogin() {
    const { username, password, captcha, captchaId } = this.data
    if (!username || !password) {
      wx.showToast({ title: '请输入账号和密码', icon: 'none' })
      return
    }
    if (!captchaId || !captcha) {
      wx.showToast({ title: '请输入验证码', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    try {
      const loginRes = await api.loginByAccount({ username, password, captcha, captchaId })
      if (loginRes.code !== 0) {
        wx.showToast({ title: loginRes.message || '登录失败', icon: 'none' })
        this.refreshCaptcha()
        return
      }
      const token = loginRes.data.token
      const userInfo = loginRes.data.userInfo
      wx.setStorageSync('token', token)
      wx.setStorageSync('userInfo', JSON.stringify(userInfo))
      wx.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 600)
    } catch (err) {
      wx.showToast({ title: '登录失败', icon: 'none' })
      this.refreshCaptcha()
    } finally {
      this.setData({ loading: false })
    }
  },

  goBack() {
    wx.navigateBack()
  },
})
