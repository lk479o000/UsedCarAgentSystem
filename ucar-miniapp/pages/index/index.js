const api = require('../../utils/api')
const { checkLogin } = require('../../utils/auth')

const STATUS_MAP = {
  0: { text: '待跟进', type: 'primary' },
  1: { text: '跟进中', type: 'primary' },
  2: { text: '已看车', type: 'warning' },
  3: { text: '已报价', type: 'warning' },
  4: { text: '已成交', type: 'success' },
  5: { text: '已失败', type: 'danger' },
}

Page({
  data: {
    stats: {
      totalLeads: 0,
      totalSuccess: 0,
      totalFail: 0,
      pendingAmount: 0,
      settledAmount: 0,
    },
    statsList: [],
    recentLeads: [],
  },

  onLoad() {
    if (!checkLogin()) return
    this.loadStats()
    this.loadRecentLeads()
  },

  onShow() {
    if (!checkLogin()) return
    this.loadStats()
    this.loadRecentLeads()
  },

  onPullDownRefresh() {
    this.loadStats()
    this.loadRecentLeads()
    wx.stopPullDownRefresh()
  },

  async loadStats() {
    try {
      const res = await api.getOverview()
      const stats = res.data
      this.setData({
        stats,
        statsList: [
          { key: 'totalLeads', title: '总线索', value: stats.totalLeads, iconClass: 'blue' },
          { key: 'totalSuccess', title: '已成交', value: stats.totalSuccess, iconClass: 'green' },
          { key: 'totalFail', title: '已失败', value: stats.totalFail, iconClass: 'red' },
          { key: 'pendingAmount', title: '待结算', value: stats.pendingAmount, iconClass: 'orange' },
          { key: 'settledAmount', title: '已结算', value: stats.settledAmount, iconClass: 'green' },
        ],
      })
    } catch (err) {
      console.error('加载统计失败:', err)
    }
  },

  async loadRecentLeads() {
    try {
      const res = await api.getLeads({ page: 1, size: 5 })
      const leads = (res.data.list || []).map((item) => ({
        ...item,
        statusText: STATUS_MAP[item.status]?.text || '未知',
        statusType: STATUS_MAP[item.status]?.type || 'primary',
      }))
      this.setData({ recentLeads: leads })
    } catch (err) {
      console.error('加载最近线索失败:', err)
    }
  },

  navigateTo(e) {
    const url = e.currentTarget.dataset.url
    wx.navigateTo({ url })
  },

  onLeadTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/leads/detail?id=${id}` })
  },

  refreshData() {
    this.loadStats()
    this.loadRecentLeads()
    wx.showToast({ title: '刷新成功', icon: 'success' })
  },
})
