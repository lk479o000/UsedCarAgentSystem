const api = require('../../utils/api')
const { checkLogin, getStoredUserInfo, isAdminUser } = require('../../utils/auth')

const SELECTED_LEAD_KEY = 'selectedLeadForSettlement'

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
    isGuest: false,
    list: [],
    loading: false,
    page: 1,
    size: 20,
    hasMore: true,
    filterStatus: '',
    statusOptions: STATUS_OPTIONS,
    showFilterPanel: false,
    currentStatusLabel: '全部',
    isAdmin: false,
    isSelectMode: false,

    // 经纪人筛选（管理员）
    agentKeyword: '',
    // 客户筛选
    customerKeyword: '',
    // 区域筛选（文本输入+闭包表查询）
    regionKeyword: '',

    // 主次分组Tab
    coreTabs: [],
    moreTabs: [],
    showMoreDropdown: false,

    // 跟进摘要
    statusCounts: {},
  },

  onLoad(options) {
    this._searchTimer = null
    this.setData({ isSelectMode: options?.mode === 'select' })
    if (options && Object.prototype.hasOwnProperty.call(options, 'status')) {
      this.setData({ filterStatus: String(options.status ?? '') })
    }
    this.updateCurrentStatusLabel(this.data.filterStatus)
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
      this.getTabBar().setData({ selected: 1 })
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
      const regionKeyword = (this.data.regionKeyword || '').trim()

      let keywordParams = {}

      // 经纪人筛选（仅管理员）
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

      // 区域筛选（文本输入+闭包表查询）
      if (regionKeyword && this.data.isAdmin) {
        keywordParams.region_keyword = regionKeyword
      }

      const params = {
        page: this.data.page,
        size: this.data.size,
        status: this.data.filterStatus,
        ...keywordParams,
      }
      const res = this.data.isAdmin
        ? await api.getAdminLeads(params)
        : await api.getLeads(params)

      const rawList = res.data.list || res.data || []
      const list = rawList.map((item) => ({
        ...item,
        statusText: STATUS_MAP[item.status]?.text || '未知',
        statusType: STATUS_MAP[item.status]?.type || 'primary',
        customerTypeText: item.customerType === 0 ? '买' : item.customerType === 1 ? '卖' : '',
        customerTypeClass: item.customerType === 0 ? 'info' : item.customerType === 1 ? 'warning' : 'primary',
        carText: `${item.carBrand || ''} ${item.carModel || ''}`.trim() || '—',
        agentName: item.agent?.username || item.agentUsername || '',
        displayPhone: this.data.isAdmin
          ? item.customerPhone
          : item.customerPhone
            ? item.customerPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
            : '',
        lastFollowupContent: item.lastFollowupContent || '',
        nextFollowupTime: item.nextFollowupTime || '',
        isOverdue: item.nextFollowupTime ? new Date(item.nextFollowupTime) < new Date() : false,
      }))

      const mergedList = this.data.page === 1 ? list : [...this.data.list, ...list]
      const hasMore = list.length === this.data.size

      // 计算状态数量用于Tab显示
      const statusCounts = {}
      if (this.data.page === 1 && this.data.isAdmin) {
        STATUS_OPTIONS.forEach((opt) => {
          if (opt.value !== '') {
            statusCounts[opt.value] = rawList.filter((item) => String(item.status) === opt.value).length
          }
        })
      }

      this.setData({ list: mergedList, hasMore, statusCounts })
      this.computeCoreTabs(statusCounts)
    } catch (err) {
      console.error('加载线索失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  computeCoreTabs(statusCounts) {
    const allTabs = STATUS_OPTIONS.filter((opt) => opt.value !== '')
    const sortedTabs = allTabs
      .map((opt) => ({ ...opt, count: statusCounts[opt.value] || 0 }))
      .sort((a, b) => b.count - a.count)

    // 取数量最多的2个非终态作为核心Tab
    const nonFinalTabs = sortedTabs.filter((t) => t.value !== '4' && t.value !== '5')
    const coreTabs = nonFinalTabs.slice(0, 2)
    const moreTabs = STATUS_OPTIONS.filter((opt) => {
      return !coreTabs.find((c) => c.value === opt.value) && opt.value !== ''
    })

    this.setData({ coreTabs, moreTabs })
  },

  toggleMoreDropdown() {
    this.setData({ showMoreDropdown: !this.data.showMoreDropdown })
  },

  closeMoreDropdown() {
    this.setData({ showMoreDropdown: false })
  },

  toggleFilterPanel() {
    this.setData({ showFilterPanel: !this.data.showFilterPanel })
  },

  updateCurrentStatusLabel(filterStatus) {
    const opt = (this.data.statusOptions || []).find((x) => String(x.value) === String(filterStatus))
    this.setData({ currentStatusLabel: opt ? opt.label : '全部' })
  },

  changeFilter(e) {
    if (!checkLogin()) {
      this.showGuest()
      wx.showToast({ title: '登录后可使用', icon: 'none' })
      return
    }
    const filterStatus = e.currentTarget.dataset.status
    this.setData({ filterStatus, page: 1, hasMore: true, showFilterPanel: false, showMoreDropdown: false })
    this.updateCurrentStatusLabel(filterStatus)
    this.loadData()
  },

  // 经纪人筛选输入
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

  onClearAgentKeyword() {
    this.setData({ agentKeyword: '', page: 1, hasMore: true })
    if (!checkLogin()) return
    this.loadData()
  },

  // 客户筛选输入
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

  onClearCustomerKeyword() {
    this.setData({ customerKeyword: '', page: 1, hasMore: true })
    if (!checkLogin()) return
    this.loadData()
  },

  // 区域筛选输入
  onRegionKeywordInput(e) {
    const v = e.detail.value
    this.setData({ regionKeyword: v })
    if (!checkLogin()) return

    if (this._searchTimer) clearTimeout(this._searchTimer)
    this._searchTimer = setTimeout(() => {
      this.setData({ page: 1, hasMore: true })
      this.loadData()
    }, 300)
  },

  onClearRegionKeyword() {
    this.setData({ regionKeyword: '', page: 1, hasMore: true })
    if (!checkLogin()) return
    this.loadData()
  },

  onSearch() {
    if (!checkLogin()) {
      this.showGuest()
      wx.showToast({ title: '登录后可使用', icon: 'none' })
      return
    }
    if (this._searchTimer) {
      clearTimeout(this._searchTimer)
      this._searchTimer = null
    }
    this.setData({ page: 1, hasMore: true })
    this.loadData()
  },

  onCardTap(e) {
    if (!checkLogin()) {
      this.showGuest()
      wx.showToast({ title: '登录后可查看', icon: 'none' })
      return
    }
    const id = e.currentTarget.dataset.id
    if (this.data.isSelectMode) {
      const item = (this.data.list || []).find((x) => String(x.id) === String(id))
      if (item) {
        wx.setStorageSync(SELECTED_LEAD_KEY, JSON.stringify({
          id: item.id,
          name: `${item.customerName} - ${(item.carBrand || '')} ${(item.carModel || '')}`.trim(),
        }))
      }
      wx.navigateBack()
      return
    }
    wx.navigateTo({ url: `/pages/leads/detail?id=${id}` })
  },

  onAddLead() {
    if (!checkLogin()) {
      this.showGuest()
      wx.showToast({ title: '登录后可使用', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/leads/form' })
  },
})
