const api = require('../../utils/api')

Page({
  data: {
    list: [],
    loading: false,
    page: 1,
    size: 20,
    hasMore: true,
    status: '',
  },

  onLoad() {
    this.loadData()
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true })
    this.loadData().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 })
      this.loadData()
    }
  },

  async loadData() {
    if (this.data.loading) return
    this.setData({ loading: true })

    try {
      const res = await api.getLeads({
        page: this.data.page,
        size: this.data.size,
        status: this.data.status,
      })

      const list = this.data.page === 1 ? res.data.list : [...this.data.list, ...res.data.list]
      const hasMore = res.data.list.length === this.data.size

      this.setData({
        list,
        hasMore,
      })
    } catch (err) {
      console.error('加载线索失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  onStatusChange(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ status, page: 1, hasMore: true })
    this.loadData()
  },
})
