const api = require('../../utils/api')

Page({
  data: {
    phone: '',
    nickname: '',
    loading: false,
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value })
  },

  async handleBind() {
    const { phone, nickname } = this.data
    if (!phone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' })
      return
    }
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      wx.showToast({ title: '手机号格式错误', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    try {
      const res = await api.bindPhone({ phone, nickname })
      wx.setStorageSync('token', res.data.token)
      wx.setStorageSync('userInfo', JSON.stringify(res.data.userInfo))
      wx.showToast({ title: '绑定成功', icon: 'success' })
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/index/index' })
      }, 1000)
    } catch (err) {
      console.error('绑定失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  },
})
