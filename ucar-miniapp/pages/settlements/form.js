const api = require('../../utils/api')
const { checkLogin } = require('../../utils/auth')

Page({
  data: {
    id: '',
    isEdit: false,
    isAdmin: false,
    leadId: '',
    leadName: '',
    profit: '',
    agentShare: '',
    notes: '',
    submitting: false,
  },

  onLoad(options) {
    if (!checkLogin()) return
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      const parsed = JSON.parse(userInfo)
      if (parsed.role !== 0) {
        wx.showToast({ title: '无权限访问', icon: 'none' })
        setTimeout(() => wx.navigateBack(), 800)
        return
      }
      this.setData({ isAdmin: true })
    }
    if (options.id) {
      this.setData({ id: options.id, isEdit: true })
      wx.setNavigationBarTitle({ title: '编辑结算' })
      this.loadDetail(options.id)
    } else {
      wx.setNavigationBarTitle({ title: '新增结算' })
    }
    if (options.leadId) {
      this.setData({ leadId: options.leadId })
      this.loadLeadInfo(options.leadId)
    }
  },

  async loadLeadInfo(leadId) {
    try {
      const res = await api.getLeadDetail(leadId)
      const lead = res.data
      this.setData({ leadName: `${lead.customerName} - ${lead.carBrand || ''} ${lead.carModel || ''}` })
      if (this.data.isEdit) return
      try {
        const settleRes = await api.getSettlementByLead(leadId)
        if (settleRes.data) {
          this.setData({
            id: settleRes.data.id,
            isEdit: true,
            profit: String(settleRes.data.profit),
            agentShare: String(settleRes.data.agentShare),
            notes: settleRes.data.notes || '',
          })
          wx.setNavigationBarTitle({ title: '重新结算' })
        }
      } catch (e) {}
    } catch (err) {
      console.error('加载线索信息失败:', err)
    }
  },

  async loadDetail(id) {
    try {
      const res = await api.getSettlementDetail(id)
      const s = res.data
      this.setData({
        leadId: s.leadId,
        leadName: `${s.lead.customerName} - ${s.lead.carBrand || ''} ${s.lead.carModel || ''}`,
        profit: String(s.profit),
        agentShare: String(s.agentShare),
        notes: s.notes || '',
      })
    } catch (err) {
      console.error('加载结算详情失败:', err)
    }
  },

  onProfitInput(e) { this.setData({ profit: e.detail.value }) },
  onAgentShareInput(e) { this.setData({ agentShare: e.detail.value }) },
  onNotesInput(e) { this.setData({ notes: e.detail.value }) },

  onSelectLead() {
    if (this.data.isEdit) return
    wx.navigateTo({ url: '/pages/leads/leads?mode=select' })
  },

  async onSubmit() {
    const { leadId, profit, agentShare, notes, id, isEdit } = this.data
    if (!leadId) { wx.showToast({ title: '请选择关联线索', icon: 'none' }); return }
    if (!profit || Number(profit) < 0) { wx.showToast({ title: '请输入有效的利润金额', icon: 'none' }); return }
    if (!agentShare || Number(agentShare) < 0) { wx.showToast({ title: '请输入有效的分成金额', icon: 'none' }); return }
    if (Number(agentShare) > Number(profit)) { wx.showToast({ title: '分成不能大于利润', icon: 'none' }); return }

    this.setData({ submitting: true })
    try {
      const data = { leadId: Number(leadId), profit: Number(profit), agentShare: Number(agentShare), notes }
      if (isEdit) {
        await api.updateSettlement(id, data)
      } else {
        await api.createSettlement(data)
      }
      wx.showToast({ title: isEdit ? '编辑成功' : '新增成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 800)
    } catch (err) {
      console.error('提交失败:', err)
    } finally {
      this.setData({ submitting: false })
    }
  },
})
