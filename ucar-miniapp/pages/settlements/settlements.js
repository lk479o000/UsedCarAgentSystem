const api = require('../../utils/api')
const { checkLogin } = require('../../utils/auth')

Page({
  data: {
    list: [],
    loading: false,
    page: 1,
    size: 20,
    hasMore: true,
    filterStatus: '',
    isAdmin: false,
  },

  onLoad() {
    if (!checkLogin()) return
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      const parsed = JSON.parse(userInfo)
      this.setData({ isAdmin: parsed.role === 0 })
    }
    this.loadData()
  },

  onShow() {
    if (!checkLogin()) return
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
      const params = {
        page: this.data.page,
        size: this.data.size,
        status: this.data.filterStatus,
      }
      const res = this.data.isAdmin
        ? await api.getAdminSettlements(params)
        : await api.getSettlements(params)

      const rawList = res.data.list || res.data || []
      const list = rawList.map((item) => ({
        ...item,
        statusText: item.status === 1 ? '已结算' : '待结算',
        statusType: item.status === 1 ? 'success' : 'warning',
      }))

      const mergedList = this.data.page === 1 ? list : [...this.data.list, ...list]
      const hasMore = list.length === this.data.size

      this.setData({ list: mergedList, hasMore })
    } catch (err) {
      console.error('加载结算失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  changeFilter(e) {
    const filterStatus = e.currentTarget.dataset.status
    this.setData({ filterStatus, page: 1, hasMore: true })
    this.loadData()
  },

  onCardTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/settlements/detail?id=${id}` })
  },

  onAddSettlement() {
    wx.navigateTo({ url: '/pages/settlements/form' })
  },
})
