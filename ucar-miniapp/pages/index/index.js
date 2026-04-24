const app = getApp()

Page({
  data: {
    stats: {
      totalLeads: 0,
      totalSuccess: 0,
      totalFail: 0,
      pendingAmount: 0,
    },
    statsList: [],
    recentLeads: [],
  },

  onLoad() {
    this.loadStats()
    this.loadRecentLeads()
  },

  onShow() {
    this.loadStats()
    this.loadRecentLeads()
  },

  onPullDownRefresh() {
    this.loadStats()
    this.loadRecentLeads()
    wx.stopPullDownRefresh()
  },

  loadStats() {
    const token = wx.getStorageSync('token')
    if (!token) return

    wx.request({
      url: `${app.globalData.baseUrl}/api/v1/dashboard/stats`,
      header: { Authorization: `Bearer ${token}` },
      success: (res) => {
        if (res.data.code === 0) {
          const stats = res.data.data
          this.setData({
            stats,
            statsList: [
              { key: 'totalLeads', title: '总线索', value: stats.totalLeads, icon: '📋', iconClass: 'blue' },
              { key: 'totalSuccess', title: '已成交', value: stats.totalSuccess, icon: '✅', iconClass: 'green' },
              { key: 'totalFail', title: '已失败', value: stats.totalFail, icon: '❌', iconClass: 'red' },
              { key: 'pendingAmount', title: '待结算', value: stats.pendingAmount, icon: '💰', iconClass: 'orange' },
            ],
          })
        }
      },
    })
  },

  loadRecentLeads() {
    const token = wx.getStorageSync('token')
    if (!token) return

    wx.request({
      url: `${app.globalData.baseUrl}/api/v1/leads`,
      header: { Authorization: `Bearer ${token}` },
      data: { page: 1, size: 5 },
      success: (res) => {
        if (res.data.code === 0) {
          const statusMap = {
            0: { text: '待跟进', type: 'primary' },
            1: { text: '跟进中', type: 'primary' },
            2: { text: '已看车', type: 'warning' },
            3: { text: '已报价', type: 'warning' },
            4: { text: '已成交', type: 'success' },
            5: { text: '已失败', type: 'danger' },
          }
          const leads = res.data.data.list.map((item) => ({
            ...item,
            statusText: statusMap[item.status]?.text || '未知',
            statusType: statusMap[item.status]?.type || 'info',
          }))
          this.setData({ recentLeads: leads })
        }
      },
    })
  },

  navigateTo(e) {
    const url = e.currentTarget.dataset.url
    wx.navigateTo({ url })
  },

  refreshData() {
    this.loadStats()
    this.loadRecentLeads()
    wx.showToast({ title: '刷新成功', icon: 'success' })
  },
})
