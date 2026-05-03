const api = require('../../../utils/api')
const { checkLogin } = require('../../../utils/auth')

Page({
  data: {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    loading: false,
    oldPasswordVisible: false,
    newPasswordVisible: false,
    confirmPasswordVisible: false,
  },

  onShow() {
    if (!checkLogin()) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      wx.navigateTo({ url: '/pages/login/login' })
      return
    }
  },

  onOldPasswordInput(e) { this.setData({ oldPassword: e.detail.value }) },
  onNewPasswordInput(e) { this.setData({ newPassword: e.detail.value }) },
  onConfirmPasswordInput(e) { this.setData({ confirmPassword: e.detail.value }) },

  toggleOldPasswordVisible() {
    this.setData({ oldPasswordVisible: !this.data.oldPasswordVisible })
  },
  toggleNewPasswordVisible() {
    this.setData({ newPasswordVisible: !this.data.newPasswordVisible })
  },
  toggleConfirmPasswordVisible() {
    this.setData({ confirmPasswordVisible: !this.data.confirmPasswordVisible })
  },

  async onSubmit() {
    if (!checkLogin()) {
      wx.showToast({ title: '登录后可使用', icon: 'none' })
      return
    }

    const { oldPassword, newPassword, confirmPassword } = this.data
    if (!oldPassword) { wx.showToast({ title: '请输入原密码', icon: 'none' }); return }
    if (!newPassword) { wx.showToast({ title: '请输入新密码', icon: 'none' }); return }
    if (newPassword.length < 8) { wx.showToast({ title: '新密码至少8位', icon: 'none' }); return }
    if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      wx.showToast({ title: '密码需包含字母和数字', icon: 'none' }); return
    }
    if (newPassword !== confirmPassword) { wx.showToast({ title: '两次密码不一致', icon: 'none' }); return }
    if (newPassword === oldPassword) { wx.showToast({ title: '新密码不能与原密码相同', icon: 'none' }); return }

    this.setData({ loading: true })
    try {
      await api.changePassword({ oldPassword, newPassword, newPasswordConfirm: confirmPassword })
      wx.showToast({ title: '密码修改成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 600)
    } catch (err) {
      console.error('change password failed:', err)
    } finally {
      this.setData({ loading: false })
    }
  },
})
