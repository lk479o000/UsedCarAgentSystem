const api = require('../../utils/api')
const { checkLogin, getStoredUserInfo, isAdminUser } = require('../../utils/auth')

Page({
  data: {
    isGuest: false,
    list: [],
    loading: false,
    page: 1,
    size: 20,
    hasMore: true,
    filterStatus: '',
    agentKeyword: '',
    customerKeyword: '',
    isAdmin: false,
  },

  onLoad(options) {
    this._searchTimer = null
    if (options && Object.prototype.hasOwnProperty.call(options, 'status')) {
      this.setData({ filterStatus: String(options.status ?? '') })
    }
    if (!checkLogin()) {
      this.showGuest()
      return
    }
    const userInfo = getStoredUserInfo()
    this.setData({ isAdmin: isAdminUser(userInfo) })
    this.loadData()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
    if (!checkLogin()) {
      this.showGuest()
      return
    }
    const userInfo = getStoredUserInfo()
    this.setData({ isGuest: false, isAdmin: isAdminUser(userInfo) })
    this.setData({ page: 1, hasMore: true })
    this.loadData()
  },

  onUnload() {
    if (this._searchTimer) {
      clearTimeout(this._searchTimer)
      this._searchTimer = null
    }
  },

  onPullDownRefresh() {
    if (!checkLogin()) {
      wx.stopPullDownRefresh()
      return
    }
    this.setData({ page: 1, hasMore: true })
    this.loadData().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (!checkLogin()) return
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 })
      this.loadData()
    }
  },

  showGuest() {
    this.setData({
      isGuest: true,
      list: [],
      loading: false,
      page: 1,
      hasMore: false,
      isAdmin: false,
    })
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  async loadData() {
    if (!checkLogin()) {
      this.showGuest()
      return
    }
    if (this.data.loading) return
    this.setData({ loading: true })

    try {
      const agentKeyword = (this.data.agentKeyword || '').trim()
      const customerKeyword = (this.data.customerKeyword || '').trim()
      
      let keywordParams = {}
      
      // 经纪人筛选
      if (agentKeyword && this.data.isAdmin) {
        if (/^\d{3,}$/.test(agentKeyword)) {
          keywordParams.agent_phone = agentKeyword
        } else {
          keywordParams.agent_name = agentKeyword
        }
      }
      
      // 客户筛选
      if (customerKeyword) {
        if (/^\d{3,}$/.test(customerKeyword)) {
          keywordParams.customer_phone = customerKeyword
        } else {
          keywordParams.customer_name = customerKeyword
        }
      }

      const params = {
        page: this.data.page,
        size: this.data.size,
        status: this.data.filterStatus,
        ...keywordParams,
      }
      const res = this.data.isAdmin
        ? await api.getAdminSettlements(params)
        : await api.getSettlements(params)

      const rawList = res.data.list || res.data || []
      const list = rawList.map((item) => ({
        ...item,
        statusText: item.status === 1 ? '已结算' : '待结算',
        statusType: item.status === 1 ? 'success' : 'warning',
        carText: `${item.lead?.carBrand || ''} ${item.lead?.carModel || ''}`.trim() || '—',
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

  onAgentKeywordInput(e) {
    const v = e.detail.value
    this.setData({ agentKeyword: v })
    if (!checkLogin()) return

    if (this._searchTimer) clearTimeout(this._searchTimer)
    this._searchTimer = setTimeout(() => {
      this.setData({ page: 1, hasMore: true })
      this.loadData()
    }, 300)
  },

  onCustomerKeywordInput(e) {
    const v = e.detail.value
    this.setData({ customerKeyword: v })
    if (!checkLogin()) return

    if (this._searchTimer) clearTimeout(this._searchTimer)
    this._searchTimer = setTimeout(() => {
      this.setData({ page: 1, hasMore: true })
      this.loadData()
    }, 300)
  },

  onClearAgentKeyword() {
    this.setData({ agentKeyword: '', page: 1, hasMore: true })
    if (!checkLogin()) return
    this.loadData()
  },

  onClearCustomerKeyword() {
    this.setData({ customerKeyword: '', page: 1, hasMore: true })
    if (!checkLogin()) return
    this.loadData()
  },

  changeFilter(e) {
    if (!checkLogin()) {
      this.showGuest()
      wx.showToast({ title: '登录后可使用', icon: 'none' })
      return
    }
    const filterStatus = e.currentTarget.dataset.status
    this.setData({ filterStatus, page: 1, hasMore: true })
    this.loadData()
  },

  onAddSettlement() {
    if (!checkLogin()) {
      this.showGuest()
      wx.showToast({ title: '登录后可使用', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/settlements/form' })
  },
})
