const api = require('../../utils/api')
const { checkLogin } = require('../../utils/auth')

Page({
  data: {
    isGuest: false,
    userInfo: null,
    form: {
      avatarUrl: '',
      nickname: '',
      phone: '',
      username: '',
    },
    roleText: '-',
    statusText: '-',
    statusClass: '',
    saving: false,
    syncingWxProfile: false,
    syncingPhone: false,
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
    if (!checkLogin()) {
      this.setData({ isGuest: true, userInfo: null })
      return
    }

    const userInfoStr = wx.getStorageSync('userInfo')
    if (userInfoStr) {
      const parsed = JSON.parse(userInfoStr)
      this.applyUserInfo(parsed)
    }

    this.refreshMe()
  },

  goToAgreement() { wx.navigateTo({ url: '/pages/agreement/index' }) },
  goToPrivacy() { wx.navigateTo({ url: '/pages/privacy/index' }) },
  goLogin() { wx.navigateTo({ url: '/pages/login/login' }) },

  goChangePassword() {
    wx.navigateTo({ url: '/pages/profile/password/password' })
  },

  applyUserInfo(userInfo) {
    const roleText = userInfo.role === 0 ? '管理员' : '经纪人'
    const statusText = userInfo.status === 1 ? '正常' : '禁用'
    const statusClass = userInfo.status === 1 ? 'ok' : 'bad'

    this.setData({
      isGuest: false,
      userInfo,
      roleText,
      statusText,
      statusClass,
      form: {
        avatarUrl: userInfo.avatarUrl || '',
        nickname: userInfo.nickname || '',
        phone: userInfo.phone || '',
        username: userInfo.username || '',
      },
    })
  },

  async refreshMe() {
    if (!checkLogin()) return
    try {
      const res = await api.getMe()
      const userInfo = res.data
      wx.setStorageSync('userInfo', JSON.stringify({
        ...JSON.parse(wx.getStorageSync('userInfo') || '{}'),
        ...userInfo,
        avatarUrl: userInfo.headimgurl || userInfo.avatarUrl,
      }))
      const merged = JSON.parse(wx.getStorageSync('userInfo'))
      this.applyUserInfo(merged)
    } catch (err) {
      // 静默失败：不影响页面展示
      console.warn('refreshMe failed:', err)
    }
  },

  onAvatarUrlInput(e) {
    this.setData({ 'form.avatarUrl': e.detail.value })
  },

  onNicknameInput(e) {
    this.setData({ 'form.nickname': e.detail.value })
  },

  onUsernameInput(e) {
    this.setData({ 'form.username': e.detail.value })
  },

  async syncWechatProfile() {
    if (!checkLogin()) {
      wx.showToast({ title: '登录后可使用', icon: 'none' })
      return
    }

    this.setData({ syncingWxProfile: true })
    try {
      const res = await new Promise((resolve, reject) => {
        wx.getUserProfile({
          desc: '用于同步头像与昵称',
          success: resolve,
          fail: reject,
        })
      })
      const { avatarUrl, nickName } = res.userInfo || {}
      this.setData({
        'form.avatarUrl': avatarUrl || this.data.form.avatarUrl,
        'form.nickname': nickName || this.data.form.nickname,
      })
      await this.saveProfile()
    } catch (err) {
      if (String(err && err.errMsg || '').includes('cancel')) {
        wx.showToast({ title: '已取消同步', icon: 'none' })
      } else {
        console.error('syncWechatProfile failed:', err)
      }
    } finally {
      this.setData({ syncingWxProfile: false })
    }
  },

  async saveProfile() {
    if (!checkLogin()) {
      wx.showToast({ title: '登录后可使用', icon: 'none' })
      return
    }

    const { avatarUrl, nickname, username } = this.data.form
    if (!username) {
      wx.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }

    if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) {
      wx.showToast({ title: '头像 URL 需以 http(s) 开头', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    try {
      const res = await api.updateMe({ username, nickname, avatarUrl })
      const newInfo = res.data && res.data.userInfo ? res.data.userInfo : null
      if (newInfo) {
        wx.setStorageSync('userInfo', JSON.stringify({ ...this.data.userInfo, ...newInfo }))
        this.applyUserInfo(JSON.parse(wx.getStorageSync('userInfo')))
      }
      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (err) {
      console.error('saveProfile failed:', err)
    } finally {
      this.setData({ saving: false })
    }
  },

  onGetPhoneNumber(e) {
    if (!checkLogin()) {
      wx.showToast({ title: '登录后可使用', icon: 'none' })
      return
    }

    if (!e.detail || !e.detail.encryptedData || !e.detail.iv) {
      wx.showToast({ title: '未获取到手机号授权', icon: 'none' })
      return
    }

    this.setData({ syncingPhone: true })

    wx.login({
      success: async (res) => {
        if (!res.code) {
          wx.showToast({ title: '微信登录失败', icon: 'none' })
          this.setData({ syncingPhone: false })
          return
        }

        try {
          const dec = await api.decryptPhone({
            code: res.code,
            encryptedData: e.detail.encryptedData,
            iv: e.detail.iv,
          })
          const phone = (dec.data && (dec.data.phoneNumber || dec.data.phone)) || ''
          if (!phone) {
            wx.showToast({ title: '同步手机号失败', icon: 'none' })
            return
          }

          const bindRes = await api.bindPhone({
            phone,
            nickname: this.data.form.nickname,
            avatarUrl: this.data.form.avatarUrl,
          })

          if (bindRes.data && bindRes.data.token) {
            wx.setStorageSync('token', bindRes.data.token)
          }
          if (bindRes.data && bindRes.data.userInfo) {
            wx.setStorageSync('userInfo', JSON.stringify(bindRes.data.userInfo))
            this.applyUserInfo(bindRes.data.userInfo)
          }
          wx.showToast({ title: '手机号已同步', icon: 'success' })
        } catch (err) {
          console.error('sync phone failed:', err)
        } finally {
          this.setData({ syncingPhone: false })
        }
      },
      fail: () => {
        wx.showToast({ title: '微信登录失败', icon: 'none' })
        this.setData({ syncingPhone: false })
      },
    })
  },

  logout() {
    if (!checkLogin()) {
      wx.navigateTo({ url: '/pages/login/login' })
      return
    }
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
