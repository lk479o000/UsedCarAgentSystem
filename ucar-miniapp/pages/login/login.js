const api = require('../../utils/api')

Page({
  data: {
    loading: false,
    agreed: false,
  },

  onLoad() {
    this.checkLoginStatus()
  },

  onShow() {
    this.checkLoginStatus()
  },

  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    if (token && userInfo) {
      wx.switchTab({ url: '/pages/index/index' })
    }
  },

  onPhoneLogin(e) {
    if (e.detail.errMsg.includes('fail') || e.detail.errMsg.includes('cancel')) {
      wx.showToast({ title: '请授权手机号以继续', icon: 'none' })
      return
    }

    if (!this.data.agreed) {
      wx.showModal({
        title: '提示',
        content: '请先阅读并同意《用户协议》和《隐私政策》',
        showCancel: true,
        cancelText: '取消',
        confirmText: '同意',
        success: (res) => {
          if (res.confirm) {
            this.setData({ agreed: true })
            this.processLogin(e)
          }
        }
      })
      return
    }

    this.processLogin(e)
  },

  processLogin(e) {
    const { encryptedData, iv } = e.detail
    if (!encryptedData || !iv) {
      wx.showToast({ title: '获取手机号失败，请重试', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    wx.login({
      success: (res) => {
        if (res.code) {
          this.doLogin(res.code, encryptedData, iv)
        } else {
          wx.showToast({ title: '微信登录失败', icon: 'none' })
          this.setData({ loading: false })
        }
      },
      fail: () => {
        wx.showToast({ title: '微信登录失败', icon: 'none' })
        this.setData({ loading: false })
      },
    })
  },

  async doLogin(code, encryptedData, iv) {
    try {
      const loginRes = await api.login({ code, encryptedData, iv })

      if (loginRes.code !== 0) {
        wx.showToast({ title: loginRes.message || '登录失败', icon: 'none' })
        this.setData({ loading: false })
        return
      }

      const token = loginRes.data.token
      const userInfo = loginRes.data.userInfo

      wx.setStorageSync('token', token)
      wx.setStorageSync('userInfo', JSON.stringify(userInfo))
      wx.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 800)
    } catch (err) {
      console.error('登录异常:', err)
      wx.showToast({ title: '登录失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  showAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '请阅读并同意用户协议以继续登录。',
      showCancel: true,
      cancelText: '拒绝',
      confirmText: '同意',
      success: (res) => {
        if (!res.confirm) {
          wx.showToast({ title: '您需要同意用户协议才能登录', icon: 'none' })
        }
      }
    })
  },

  showPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '请阅读并同意隐私政策以继续登录。',
      showCancel: true,
      cancelText: '拒绝',
      confirmText: '同意',
      success: (res) => {
        if (!res.confirm) {
          wx.showToast({ title: '您需要同意隐私政策才能登录', icon: 'none' })
        }
      }
    })
  },

  toggleAgreement() {
    this.setData({
      agreed: !this.data.agreed
    })
  },

  showAgreementTip() {
    wx.showModal({
      title: '提示',
      content: '请先阅读并同意《用户协议》和《隐私政策》',
      showCancel: true,
      cancelText: '取消',
      confirmText: '同意',
      success: (res) => {
        if (res.confirm) {
          this.setData({ agreed: true })
        }
      }
    })
  },

  onPhoneLogin(e) {
    if (e.detail.errMsg.includes('fail') || e.detail.errMsg.includes('cancel')) {
      wx.showToast({ title: '请授权手机号以继续', icon: 'none' })
      return
    }

    this.processLogin(e)
  },

  processLogin(e) {
    const { encryptedData, iv } = e.detail
    if (!encryptedData || !iv) {
      wx.showToast({ title: '获取手机号失败，请重试', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    wx.login({
      success: (res) => {
        if (res.code) {
          this.doLogin(res.code, encryptedData, iv)
        } else {
          wx.showToast({ title: '微信登录失败', icon: 'none' })
          this.setData({ loading: false })
        }
      },
      fail: () => {
        wx.showToast({ title: '微信登录失败', icon: 'none' })
        this.setData({ loading: false })
      },
    })
  },
})