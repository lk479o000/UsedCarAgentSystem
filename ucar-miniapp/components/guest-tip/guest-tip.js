Component({
  properties: {
    tipText: {
      type: String,
      value: '登录后可查看完整功能'
    }
  },
  methods: {
    goLogin() {
      wx.navigateTo({
        url: '/pages/login/login'
      })
    }
  }
})