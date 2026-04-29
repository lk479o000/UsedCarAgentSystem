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
    isGuest: false,
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
    if (!checkLogin()) {
      this.showGuest()
      return
    }
    this.loadStats()
    this.loadRecentLeads()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
    if (!checkLogin()) {
      this.showGuest()
      return
    }
    this.setData({ isGuest: false })
    this.loadStats()
    this.loadRecentLeads()
  },

  onPullDownRefresh() {
    if (!checkLogin()) {
      wx.stopPullDownRefresh()
      return
    }
    this.loadStats()
    this.loadRecentLeads()
    wx.stopPullDownRefresh()
  },

  showGuest() {
    this.setData({
      isGuest: true,
      stats: {
        totalLeads: 0,
        totalSuccess: 0,
        totalFail: 0,
        pendingAmount: 0,
        settledAmount: 0,
      },
      statsList: [
          {
            key: 'totalLeads',
            title: '总线索',
            displayValue: '—',
            tone: 'blue',
            iconClass: 'blue',
            icon: 'i-lucide-list',
            target: 'leads',
            filter: '',
          },
          {
            key: 'totalSuccess',
            title: '已成交',
            displayValue: '—',
            tone: 'green',
            iconClass: 'green',
            icon: 'i-lucide-check-circle',
            target: 'leads',
            filter: '4',
          },
          {
            key: 'totalFail',
            title: '已失败',
            displayValue: '—',
            tone: 'red',
            iconClass: 'red',
            icon: 'i-lucide-x-circle',
            target: 'leads',
            filter: '5',
          },
          {
            key: 'pendingAmount',
            title: '待结算',
            displayValue: '—',
            tone: 'orange',
            iconClass: 'orange',
            icon: 'i-lucide-hourglass',
            target: 'settlements',
            filter: '0',
          },
          {
            key: 'settledAmount',
            title: '已结算',
            displayValue: '—',
            tone: 'teal',
            iconClass: 'green',
            icon: 'i-lucide-wallet',
            target: 'settlements',
            filter: '1',
          },
        ],
      recentLeads: [],
    })
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  async loadStats() {
    try {
      const res = await api.getOverview()
      const stats = res.data
      const formatMoney = (n) => {
        if (n === null || n === undefined || n === '') return '—'
        const num = Number(n)
        if (Number.isNaN(num)) return String(n)
        // 统一展示：整数不带小数；有小数保留 2 位
        const v = Number.isInteger(num) ? String(num) : num.toFixed(2)
        return `¥${v}`
      }
      this.setData({
        stats,
        statsList: [
          {
            key: 'totalLeads',
            title: '总线索',
            displayValue: stats.totalLeads ?? 0,
            tone: 'blue',
            iconClass: 'blue',
            icon: 'i-lucide-list',
            target: 'leads',
            filter: '',
          },
          {
            key: 'totalSuccess',
            title: '已成交',
            displayValue: stats.totalSuccess ?? 0,
            tone: 'green',
            iconClass: 'green',
            icon: 'i-lucide-check-circle',
            target: 'leads',
            filter: '4',
          },
          {
            key: 'totalFail',
            title: '已失败',
            displayValue: stats.totalFail ?? 0,
            tone: 'red',
            iconClass: 'red',
            icon: 'i-lucide-x-circle',
            target: 'leads',
            filter: '5',
          },
          {
            key: 'pendingAmount',
            title: '待结算',
            displayValue: formatMoney(stats.pendingAmount ?? 0),
            tone: 'orange',
            iconClass: 'orange',
            icon: 'i-lucide-hourglass',
            target: 'settlements',
            filter: '0',
          },
          {
            key: 'settledAmount',
            title: '已结算',
            displayValue: formatMoney(stats.settledAmount ?? 0),
            tone: 'teal',
            iconClass: 'green',
            icon: 'i-lucide-wallet',
            target: 'settlements',
            filter: '1',
          },
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
    if (!checkLogin()) {
      this.showGuest()
      wx.showToast({ title: '登录后可使用', icon: 'none' })
      return
    }
    const url = e.currentTarget.dataset.url
    wx.navigateTo({ url })
  },

  onLeadTap(e) {
    if (!checkLogin()) {
      this.showGuest()
      wx.showToast({ title: '登录后可查看', icon: 'none' })
      return
    }
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/leads/detail?id=${id}` })
  },

  refreshData() {
    if (!checkLogin()) {
      this.showGuest()
      wx.showToast({ title: '登录后可刷新', icon: 'none' })
      return
    }
    this.loadStats()
    this.loadRecentLeads()
    wx.showToast({ title: '刷新成功', icon: 'success' })
  },

  onStatTap(e) {
    if (!checkLogin()) {
      this.showGuest()
      wx.showToast({ title: '登录后可查看', icon: 'none' })
      return
    }
    const target = e.currentTarget.dataset.target
    const filter = e.currentTarget.dataset.filter
    if (target === 'leads') {
      const url = filter !== undefined && filter !== null && String(filter) !== ''
        ? `/pages/leads/leads?status=${encodeURIComponent(String(filter))}`
        : '/pages/leads/leads'
      wx.navigateTo({ url })
      return
    }
    if (target === 'settlements') {
      const url = filter !== undefined && filter !== null && String(filter) !== ''
        ? `/pages/settlements/settlements?status=${encodeURIComponent(String(filter))}`
        : '/pages/settlements/settlements'
      wx.navigateTo({ url })
    }
  },
})
