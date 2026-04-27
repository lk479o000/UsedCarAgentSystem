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

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: '0', label: '待跟进' },
  { value: '1', label: '跟进中' },
  { value: '2', label: '已看车' },
  { value: '3', label: '已报价' },
  { value: '4', label: '已成交' },
  { value: '5', label: '已失败' },
]

Page({
  data: {
    list: [],
    loading: false,
    page: 1,
    size: 20,
    hasMore: true,
    filterStatus: '',
    searchKeyword: '',
    statusOptions: STATUS_OPTIONS,
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
        keyword: this.data.searchKeyword,
      }
      const res = this.data.isAdmin
        ? await api.getAdminLeads(params)
        : await api.getLeads(params)

      const rawList = res.data.list || res.data || []
      const list = rawList.map((item) => ({
        ...item,
        statusText: STATUS_MAP[item.status]?.text || '未知',
        statusType: STATUS_MAP[item.status]?.type || 'primary',
        displayPhone: this.data.isAdmin
          ? item.customerPhone
          : item.customerPhone
            ? item.customerPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
            : '',
      }))

      const mergedList = this.data.page === 1 ? list : [...this.data.list, ...list]
      const hasMore = list.length === this.data.size

      this.setData({ list: mergedList, hasMore })
    } catch (err) {
      console.error('加载线索失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  changeFilter(e) {
    const filterStatus = e.currentTarget.dataset.status
    this.setData({ filterStatus, page: 1, hasMore: true })
    this.loadData()
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  onSearch() {
    this.setData({ page: 1, hasMore: true })
    this.loadData()
  },

  onCardTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/leads/detail?id=${id}` })
  },

  onAddLead() {
    wx.navigateTo({ url: '/pages/leads/form' })
  },
})
