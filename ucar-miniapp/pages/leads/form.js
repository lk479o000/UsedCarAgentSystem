const api = require('../../utils/api')
const { checkLogin } = require('../../utils/auth')

Page({
  data: {
    id: '',
    isEdit: false,
    isAdmin: false,
    customerName: '',
    customerPhone: '',
    customerType: 0,
    customerTypeText: '买家',
    carBrand: '',
    carModel: '',
    agentId: '',
    agentName: '',
    notes: '',
    agents: [],
    agentNames: [],
    agentIndex: 0,
    customerTypeOptions: ['买家', '卖家'],
    customerTypeIndex: 0,
    submitting: false,
  },

  onLoad(options) {
    if (!checkLogin()) return
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      const parsed = JSON.parse(userInfo)
      this.setData({ isAdmin: parsed.role === 0 })
    }
    if (!this.data.isAdmin) {
      wx.showToast({ title: '无权限访问', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 800)
      return
    }
    this.loadAgents()
    if (options.id) {
      this.setData({ id: options.id, isEdit: true })
      wx.setNavigationBarTitle({ title: '编辑线索' })
      this.loadDetail(options.id)
    } else {
      wx.setNavigationBarTitle({ title: '新增线索' })
    }
  },

  async loadAgents() {
    try {
      const res = await api.getAgents()
      const agents = res.data || []
      const agentNames = agents.map((a) => a.username)
      this.setData({ agents, agentNames })
    } catch (err) {
      console.error('加载经纪人列表失败:', err)
    }
  },

  async loadDetail(id) {
    try {
      const res = await api.getLeadDetail(id)
      const d = res.data
      const agentIndex = this.data.agents.findIndex((a) => a.id === d.agentId)
      this.setData({
        customerName: d.customerName,
        customerPhone: d.customerPhone,
        customerType: d.customerType,
        customerTypeText: d.customerType === 0 ? '买家' : '卖家',
        customerTypeIndex: d.customerType,
        carBrand: d.carBrand || '',
        carModel: d.carModel || '',
        agentId: d.agentId || '',
        agentName: d.agentName || '',
        notes: d.notes || '',
        agentIndex: agentIndex >= 0 ? agentIndex : 0,
      })
    } catch (err) {
      console.error('加载线索详情失败:', err)
    }
  },

  onCustomerNameInput(e) { this.setData({ customerName: e.detail.value }) },
  onCustomerPhoneInput(e) { this.setData({ customerPhone: e.detail.value }) },
  onCarBrandInput(e) { this.setData({ carBrand: e.detail.value }) },
  onCarModelInput(e) { this.setData({ carModel: e.detail.value }) },
  onNotesInput(e) { this.setData({ notes: e.detail.value }) },

  onCustomerTypeChange(e) {
    const idx = e.detail.value
    this.setData({
      customerTypeIndex: idx,
      customerType: idx === 0 ? 0 : 1,
      customerTypeText: this.data.customerTypeOptions[idx],
    })
  },

  onAgentChange(e) {
    const idx = e.detail.value
    const agent = this.data.agents[idx]
    this.setData({
      agentIndex: idx,
      agentId: agent ? agent.id : '',
      agentName: agent ? agent.username : '',
    })
  },

  async onSubmit() {
    const { customerName, customerPhone, customerType, carBrand, carModel, agentId, notes, id, isEdit } = this.data
    if (!customerName) { wx.showToast({ title: '请输入客户姓名', icon: 'none' }); return }
    if (!customerPhone) { wx.showToast({ title: '请输入客户电话', icon: 'none' }); return }
    if (!/^1\d{10}$/.test(customerPhone)) { wx.showToast({ title: '手机号格式错误', icon: 'none' }); return }
    if (!carModel) { wx.showToast({ title: '请输入车辆型号', icon: 'none' }); return }
    if (!agentId && !isEdit) { wx.showToast({ title: '请选择归属经纪人', icon: 'none' }); return }

    this.setData({ submitting: true })
    try {
      const data = { customerName, customerPhone, customerType, carBrand, carModel, agentId, notes }
      if (isEdit) {
        await api.updateLead(id, data)
      } else {
        await api.createLead(data)
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
