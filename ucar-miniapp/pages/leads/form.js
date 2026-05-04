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
    provinceId: '',
    provinceIndex: -1,
    provinceNames: [],
    provinces: [],
    cityId: '',
    cityIndex: -1,
    cityNames: [],
    cities: [],
    districtId: '',
    districtIndex: -1,
    districtNames: [],
    districts: [],
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
    if (!checkLogin({ redirect: true })) return
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
    if (options.id) {
      this.setData({ id: options.id, isEdit: true })
      wx.setNavigationBarTitle({ title: '编辑线索' })
      this.initEdit(options.id)
    } else {
      wx.setNavigationBarTitle({ title: '新增线索' })
      this.loadAgents()
      this.loadProvinces()
    }
  },

  async initEdit(id) {
    await this.loadAgents()
    await this.loadProvinces()
    await this.loadDetail(id)
  },

  async loadProvinces() {
    try {
      const res = await api.getProvinces()
      const provinces = res.data || []
      const provinceNames = provinces.map((p) => p.regionName)
      const defaultProvinceId = 22
      const defaultCityId = 1930
      const provinceIndex = provinces.findIndex((p) => p.id === defaultProvinceId)
      this.setData({
        provinces,
        provinceNames,
        provinceId: provinceIndex >= 0 ? defaultProvinceId : '',
        provinceIndex: provinceIndex >= 0 ? provinceIndex : -1,
      })
      if (provinceIndex >= 0) {
        await this.loadCities(defaultProvinceId)
        const cityIndex = this.data.cities.findIndex((c) => c.id === defaultCityId)
        this.setData({
          cityId: cityIndex >= 0 ? defaultCityId : '',
          cityIndex: cityIndex >= 0 ? cityIndex : -1,
        })
        if (cityIndex >= 0) {
          await this.loadDistricts(defaultCityId)
        }
      }
    } catch (err) {
      console.error('加载省份失败:', err)
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
      const agentIndex = this.data.agents.findIndex((a) => a.userid === d.userId)
      const provinceIndex = this.data.provinces.findIndex((p) => p.id === d.provinceId)

      this.setData({
        customerName: d.customerName,
        customerPhone: d.customerPhone,
        customerType: d.customerType,
        customerTypeText: d.customerType === 0 ? '买家' : '卖家',
        customerTypeIndex: d.customerType,
        carBrand: d.carBrand || '',
        carModel: d.carModel || '',
        provinceId: d.provinceId || '',
        provinceIndex: provinceIndex >= 0 ? provinceIndex : -1,
        cityId: d.cityId || '',
        districtId: d.districtId || '',
        agentId: d.userId || '',
        agentName: d.agent?.username || '',
        notes: d.notes || '',
        agentIndex: agentIndex >= 0 ? agentIndex : 0,
      })

      if (d.provinceId) {
        await this.loadCities(d.provinceId)
        if (d.cityId) {
          const cityIndex = this.data.cities.findIndex((c) => c.id === d.cityId)
          this.setData({ cityIndex: cityIndex >= 0 ? cityIndex : -1 })
          await this.loadDistricts(d.cityId)
          if (d.districtId) {
            const districtIndex = this.data.districts.findIndex((dd) => dd.id === d.districtId)
            this.setData({ districtIndex: districtIndex >= 0 ? districtIndex : -1 })
          }
        }
      }
    } catch (err) {
      console.error('加载线索详情失败:', err)
    }
  },

  onCustomerNameInput(e) { this.setData({ customerName: e.detail.value }) },
  onCustomerPhoneInput(e) { this.setData({ customerPhone: e.detail.value }) },
  onCarBrandInput(e) { this.setData({ carBrand: e.detail.value }) },
  onCarModelInput(e) { this.setData({ carModel: e.detail.value }) },
  onNotesInput(e) { this.setData({ notes: e.detail.value }) },

  onProvinceChange(e) {
    const idx = e.detail.value
    const province = this.data.provinces[idx]
    this.setData({
      provinceIndex: idx,
      provinceId: province ? province.id : '',
      cityId: '',
      cityIndex: -1,
      cityNames: [],
      cities: [],
      districtId: '',
      districtIndex: -1,
      districtNames: [],
      districts: [],
    })
    if (province) {
      this.loadCities(province.id)
    }
  },

  onCityChange(e) {
    const idx = e.detail.value
    const city = this.data.cities[idx]
    this.setData({
      cityIndex: idx,
      cityId: city ? city.id : '',
      districtId: '',
      districtIndex: -1,
      districtNames: [],
      districts: [],
    })
    if (city) {
      this.loadDistricts(city.id)
    }
  },

  onDistrictChange(e) {
    const idx = e.detail.value
    const district = this.data.districts[idx]
    this.setData({
      districtIndex: idx,
      districtId: district ? district.id : '',
    })
  },

  async loadCities(provinceId) {
    try {
      const res = await api.getCities(provinceId)
      const cities = res.data || []
      this.setData({
        cities,
        cityNames: cities.map((c) => c.regionName),
      })
    } catch (err) {
      console.error('加载城市失败:', err)
    }
  },

  async loadDistricts(cityId) {
    try {
      const res = await api.getDistricts(cityId)
      const districts = res.data || []
      this.setData({
        districts,
        districtNames: districts.map((d) => d.regionName),
      })
    } catch (err) {
      console.error('加载区县失败:', err)
    }
  },

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
      agentId: agent ? agent.userid : '',
      agentName: agent ? agent.username : '',
    })
  },

  async onSubmit() {
    const { customerName, customerPhone, customerType, carBrand, carModel, provinceId, cityId, districtId, agentId, notes, id, isEdit } = this.data
    if (!customerName) { wx.showToast({ title: '请输入客户姓名', icon: 'none' }); return }
    if (!customerPhone) { wx.showToast({ title: '请输入客户电话', icon: 'none' }); return }
    if (!/^1\d{10}$/.test(customerPhone)) { wx.showToast({ title: '手机号格式错误', icon: 'none' }); return }
    if (!carModel) { wx.showToast({ title: '请输入车辆型号', icon: 'none' }); return }
    if (!agentId && !isEdit) { wx.showToast({ title: '请选择归属经纪人', icon: 'none' }); return }

    this.setData({ submitting: true })
    try {
      const data = {
        customerName,
        customerPhone,
        customerType,
        carBrand,
        carModel,
        provinceId: provinceId || null,
        cityId: cityId || null,
        districtId: districtId || null,
        userId: agentId,
        notes,
      }
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
