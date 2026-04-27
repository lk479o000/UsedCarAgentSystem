const api = require('../../utils/api')
const { checkLogin } = require('../../utils/auth')

Page({
  data: {
    userInfo: null,
    isAdmin: false,
    showPasswordModal: false,
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    changingPassword: false,
  },

  onShow() {
    if (!checkLogin()) return
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      const parsed = JSON.parse(userInfo)
      this.setData({ userInfo: parsed, isAdmin: parsed.role === 0 })
    }
  },

  goToAgreement() { wx.navigateTo({ url: '/pages/agreement/index' }) },
  goToPrivacy() { wx.navigateTo({ url: '/pages/privacy/index' }) },
  goToBindPhone() { wx.navigateTo({ url: '/pages/bind-phone/bind-phone' }) },

  showChangePassword() {
    this.setData({ showPasswordModal: true, oldPassword: '', newPassword: '', confirmPassword: '' })
  },

  closePasswordModal() {
    this.setData({ showPasswordModal: false })
  },

  onOldPasswordInput(e) { this.setData({ oldPassword: e.detail.value }) },
  onNewPasswordInput(e) { this.setData({ newPassword: e.detail.value }) },
  onConfirmPasswordInput(e) { this.setData({ confirmPassword: e.detail.value }) },

  async onChangePassword() {
    const { oldPassword, newPassword, confirmPassword } = this.data
    if (!oldPassword) { wx.showToast({ title: '请输入原密码', icon: 'none' }); return }
    if (!newPassword) { wx.showToast({ title: '请输入新密码', icon: 'none' }); return }
    if (newPassword.length < 8) { wx.showToast({ title: '新密码至少8位', icon: 'none' }); return }
    if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      wx.showToast({ title: '密码需包含字母和数字', icon: 'none' }); return
    }
    if (newPassword !== confirmPassword) { wx.showToast({ title: '两次密码不一致', icon: 'none' }); return }

    this.setData({ changingPassword: true })
    try {
      await api.changePassword({ oldPassword, newPassword })
      wx.showToast({ title: '密码修改成功', icon: 'success' })
      this.setData({ showPasswordModal: false })
    } catch (err) {
      console.error('修改密码失败:', err)
    } finally {
      this.setData({ changingPassword: false })
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
            wx.reLaunch({ url: '/pages/login/login' })
          }, 1000)
        }
      },
    })
  },
})
