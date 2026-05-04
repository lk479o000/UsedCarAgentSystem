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

const STATUS_TRANSITIONS = {
  0: [{ value: 1, label: '跟进中' }],
  1: [{ value: 2, label: '已看车' }, { value: 5, label: '已失败' }],
  2: [{ value: 3, label: '已报价' }, { value: 5, label: '已失败' }],
  3: [{ value: 4, label: '已成交' }, { value: 5, label: '已失败' }],
  4: [],
  5: [],
}

Page({
  data: {
    id: '',
    lead: null,
    followups: [],
    isAdmin: false,
    loading: true,
    showStatusSheet: false,
    statusOptions: [],
    showDealInput: false,
    showFailInput: false,
    dealPrice: '',
    failReason: '',
    hasSettlement: false,

    showMoreSheet: false,

    followupExpanded: false,
    displayFollowups: [],
    hasMoreFollowups: false,

    showMoreInfo: false,

    statusBarHeight: 0,
    navBarHeight: 0,
  },

  onLoad(options) {
    if (!checkLogin({ redirect: true })) return
    const sysInfo = wx.getSystemInfoSync()
    const statusBarHeight = sysInfo.statusBarHeight || 20
    this.setData({
      statusBarHeight,
      navBarHeight: statusBarHeight + 44,
    })
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      const parsed = JSON.parse(userInfo)
      this.setData({ isAdmin: parsed.role === 0 })
    }
    if (options.id) {
      this.setData({ id: options.id })
      this.loadDetail()
    }
  },

  onShow() {
    if (!checkLogin({ redirect: true })) return
    if (this.data.id) {
      this.loadDetail()
    }
  },

  async loadDetail() {
    this.setData({ loading: true })
    try {
      const res = await api.getLeadDetail(this.data.id)
      const lead = res.data
      lead.statusText = STATUS_MAP[lead.status]?.text || '未知'
      lead.statusType = STATUS_MAP[lead.status]?.type || 'primary'
      lead.customerTypeText = lead.customerType === 0 ? '买家' : lead.customerType === 1 ? '卖家' : '-'
      lead.displayPhone = this.data.isAdmin
        ? lead.customerPhone
        : lead.customerPhone
          ? lead.customerPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
          : ''
      lead.agentName = lead.agent?.username || ''

      lead.regionText = await this.buildRegionText(lead.provinceId, lead.cityId, lead.districtId)

      // 可流转状态提示
      const transitions = STATUS_TRANSITIONS[lead.status] || []
      lead.flowText = transitions.map((t) => t.label).join(' · ')

      this.setData({ lead })

      // 经纪人也加载跟进记录（只读）
      this.loadFollowups()

      if (this.data.isAdmin) {
        this.checkSettlement()
      }
    } catch (err) {
      console.error('加载线索详情失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  async loadFollowups() {
    try {
      const res = await api.getFollowups(this.data.id)
      const followups = res.data || []
      const formatted = followups.map((item) => ({
        ...item,
        displayTime: this.formatFollowupTime(item.followupTime),
        isOverdue: item.nextFollowupTime ? new Date(item.nextFollowupTime) < new Date() : false,
      }))

      // 智能折叠：最多显示3条
      const displayFollowups = formatted.slice(0, 3)
      const hasMoreFollowups = formatted.length > 3

      this.setData({
        followups: formatted,
        displayFollowups,
        hasMoreFollowups,
        followupExpanded: false,
      })
    } catch (err) {
      console.error('加载跟进记录失败:', err)
    }
  },

  formatFollowupTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 86400000)
    const diffDays = Math.floor((today.getTime() - date.getTime()) / 86400000)

    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const time = `${hours}:${minutes}`

    if (date >= today) {
      return `今天 ${time}`
    }
    if (date >= yesterday) {
      return `昨天 ${time}`
    }
    if (diffDays < 7) {
      return `${diffDays}天前`
    }
    if (date.getFullYear() === now.getFullYear()) {
      return `${date.getMonth() + 1}/${date.getDate()} ${time}`
    }
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
  },

  toggleFollowupExpand() {
    const expanded = !this.data.followupExpanded
    this.setData({
      followupExpanded: expanded,
      displayFollowups: expanded ? this.data.followups : this.data.followups.slice(0, 3),
    })
  },

  toggleMoreInfo() {
    this.setData({ showMoreInfo: !this.data.showMoreInfo })
  },

  async checkSettlement() {
    try {
      const res = await api.getSettlementByLead(this.data.id)
      this.setData({ hasSettlement: !!res.data })
    } catch (err) {
      this.setData({ hasSettlement: false })
    }
  },

  onEdit() {
    wx.navigateTo({ url: `/pages/leads/form?id=${this.data.id}` })
  },

  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确认删除该线索？',
      confirmColor: '#EF4444',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.deleteLead(this.data.id)
            wx.showToast({ title: '删除成功', icon: 'success' })
            setTimeout(() => wx.navigateBack(), 800)
          } catch (err) {
            console.error('删除失败:', err)
          }
        }
      },
    })
  },

  onUpdateStatus() {
    const lead = this.data.lead
    if (!lead) return
    const transitions = STATUS_TRANSITIONS[lead.status] || []
    if (transitions.length === 0) {
      wx.showToast({ title: '当前状态不可变更', icon: 'none' })
      return
    }
    this.setData({ statusOptions: transitions, showStatusSheet: true })
  },

  onStatusSelect(e) {
    const newStatus = e.currentTarget.dataset.value
    this.setData({ showStatusSheet: false })

    if (newStatus === 4) {
      this.setData({ showDealInput: true, dealPrice: '' })
      return
    }
    if (newStatus === 5) {
      this.setData({ showFailInput: true, failReason: '' })
      return
    }

    this.doUpdateStatus(newStatus)
  },

  onDealPriceInput(e) {
    this.setData({ dealPrice: e.detail.value })
  },

  onConfirmDeal() {
    if (!this.data.dealPrice) {
      wx.showToast({ title: '请输入成交价格', icon: 'none' })
      return
    }
    this.doUpdateStatus(4, { carActualPrice: this.data.dealPrice })
    this.setData({ showDealInput: false })
  },

  onFailReasonInput(e) {
    this.setData({ failReason: e.detail.value })
  },

  onConfirmFail() {
    if (!this.data.failReason) {
      wx.showToast({ title: '请输入失败原因', icon: 'none' })
      return
    }
    this.doUpdateStatus(5, { failReason: this.data.failReason })
    this.setData({ showFailInput: false })
  },

  async doUpdateStatus(newStatus, extra = {}) {
    try {
      await api.updateLeadStatus(this.data.id, { status: newStatus, ...extra })
      wx.showToast({ title: '状态更新成功', icon: 'success' })
      this.loadDetail()
    } catch (err) {
      console.error('更新状态失败:', err)
    }
  },

  onSettlement() {
    wx.navigateTo({ url: `/pages/settlements/form?leadId=${this.data.id}` })
  },

  onReSettlement() {
    wx.navigateTo({ url: `/pages/settlements/form?leadId=${this.data.id}&re=1` })
  },

  onAddFollowup() {
    wx.navigateTo({ url: `/pages/followups/form?leadId=${this.data.id}` })
  },

  onEditFollowup(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/followups/form?leadId=${this.data.id}&id=${id}` })
  },

  onDeleteFollowup(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确认删除该跟进记录？',
      confirmColor: '#EF4444',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.deleteFollowup(id)
            wx.showToast({ title: '删除成功', icon: 'success' })
            this.loadFollowups()
          } catch (err) {
            console.error('删除跟进记录失败:', err)
          }
        }
      },
    })
  },

  // 拨打电话
  onMakePhoneCall() {
    const lead = this.data.lead
    if (!lead || !lead.customerPhone) {
      wx.showToast({ title: '暂无电话号码', icon: 'none' })
      return
    }
    wx.makePhoneCall({
      phoneNumber: lead.customerPhone,
      fail: () => {
        wx.showToast({ title: '拨打失败', icon: 'none' })
      },
    })
  },

  onGoBack() {
    wx.navigateBack({ delta: 1 })
  },

  // 更多菜单
  showMoreActions() {
    this.setData({ showMoreSheet: true })
  },

  closeMoreSheet() {
    this.setData({ showMoreSheet: false })
  },

  onMoreAction(e) {
    const action = e.currentTarget.dataset.action
    this.setData({ showMoreSheet: false })
    switch (action) {
      case 'call':
        this.onMakePhoneCall()
        break
      case 'edit':
        this.onEdit()
        break
      case 'settlement':
        this.onSettlement()
        break
      case 'reSettlement':
        this.onReSettlement()
        break
      case 'delete':
        this.onDelete()
        break
    }
  },

  closeStatusSheet() {
    this.setData({ showStatusSheet: false })
  },

  closeDealInput() {
    this.setData({ showDealInput: false })
  },

  closeFailInput() {
    this.setData({ showFailInput: false })
  },

  noop() {},

  async buildRegionText(provinceId, cityId, districtId) {
    const parts = []
    try {
      if (provinceId) {
        const res = await api.getProvinces()
        const province = (res.data || []).find((p) => p.id === provinceId)
        if (province) parts.push(province.regionName)
      }
      if (cityId) {
        const res = await api.getCities(provinceId)
        const city = (res.data || []).find((c) => c.id === cityId)
        if (city) parts.push(city.regionName)
      }
      if (districtId) {
        const res = await api.getDistricts(cityId)
        const district = (res.data || []).find((d) => d.id === districtId)
        if (district) parts.push(district.regionName)
      }
    } catch (err) {
      console.error('构建区域文本失败:', err)
    }
    return parts.join(' / ')
  },
})
