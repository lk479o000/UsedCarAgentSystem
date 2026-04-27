const api = require('../../utils/api')
const { checkLogin } = require('../../utils/auth')

Page({
  data: {
    id: '',
    settlement: null,
    isAdmin: false,
    loading: true,
    showStatusSheet: false,
    settledAt: '',
    showSettleDialog: false,
  },

  onLoad(options) {
    if (!checkLogin()) return
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

  async loadDetail() {
    this.setData({ loading: true })
    try {
      const res = await api.getSettlementDetail(this.data.id)
      const s = res.data
      s.statusText = s.status === 1 ? '已结算' : '待结算'
      s.statusType = s.status === 1 ? 'success' : 'warning'
      this.setData({ settlement: s })
    } catch (err) {
      console.error('加载结算详情失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onEdit() {
    wx.navigateTo({ url: `/pages/settlements/form?id=${this.data.id}` })
  },

  onUpdateStatus() {
    this.setData({ showStatusSheet: true })
  },

  onStatusSelect(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ showStatusSheet: false })
    if (status === 1) {
      const now = new Date()
      const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      this.setData({ showSettleDialog: true, settledAt: timeStr })
      return
    }
    this.doUpdateStatus(status)
  },

  onSettledAtChange(e) {
    this.setData({ settledAt: e.detail.value })
  },

  onConfirmSettle() {
    if (!this.data.settledAt) {
      wx.showToast({ title: '请选择结算时间', icon: 'none' })
      return
    }
    this.doUpdateStatus(1, { settledAt: this.data.settledAt })
    this.setData({ showSettleDialog: false })
  },

  async doUpdateStatus(status, extra = {}) {
    try {
      await api.updateSettlement(this.data.id, { status, ...extra })
      wx.showToast({ title: '状态更新成功', icon: 'success' })
      this.loadDetail()
    } catch (err) {
      console.error('更新状态失败:', err)
    }
  },

  closeStatusSheet() {
    this.setData({ showStatusSheet: false })
  },

  closeSettleDialog() {
    this.setData({ showSettleDialog: false })
  },
})
