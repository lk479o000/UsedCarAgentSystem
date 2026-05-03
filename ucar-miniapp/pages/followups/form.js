const api = require('../../utils/api')
const { checkLogin } = require('../../utils/auth')

Page({
  data: {
    leadId: '',
    id: '',
    isEdit: false,
    followupContent: '',
    followupResult: '',
    followupTime: '',
    nextFollowupTime: '',
    submitting: false,
  },

  onLoad(options) {
    if (!checkLogin({ redirect: true })) return
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      const parsed = JSON.parse(userInfo)
      if (parsed.role !== 0) {
        wx.showToast({ title: '无权限访问', icon: 'none' })
        setTimeout(() => wx.navigateBack(), 800)
        return
      }
    }
    if (options.leadId) this.setData({ leadId: options.leadId })
    if (options.id) {
      this.setData({ id: options.id, isEdit: true })
      wx.setNavigationBarTitle({ title: '编辑跟进记录' })
      this.loadDetail(options.id)
    } else {
      wx.setNavigationBarTitle({ title: '新增跟进记录' })
      const now = new Date()
      const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      this.setData({ followupTime: timeStr })
    }
  },

  async loadDetail(id) {
    try {
      const res = await api.getFollowups(this.data.leadId)
      const followup = (res.data || []).find((f) => f.id == id)
      if (followup) {
        this.setData({
          followupContent: followup.followupContent,
          followupResult: followup.followupResult || '',
          followupTime: followup.followupTime || '',
          nextFollowupTime: followup.nextFollowupTime || '',
        })
      }
    } catch (err) {
      console.error('加载跟进记录失败:', err)
    }
  },

  onContentInput(e) { this.setData({ followupContent: e.detail.value }) },
  onResultInput(e) { this.setData({ followupResult: e.detail.value }) },
  onFollowUpTimeChange(e) { this.setData({ followupTime: e.detail.value }) },
  onNextFollowUpTimeChange(e) { this.setData({ nextFollowupTime: e.detail.value }) },

  async onSubmit() {
    if (!this.data.followupContent) {
      wx.showToast({ title: '请输入跟进内容', icon: 'none' })
      return
    }
    if (!this.data.followupTime) {
      wx.showToast({ title: '请选择这次跟进时间', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    try {
      const data = {
        followupContent: this.data.followupContent,
        followupResult: this.data.followupResult,
        followupTime: this.data.followupTime,
        nextFollowupTime: this.data.nextFollowupTime,
      }
      if (this.data.isEdit) {
        await api.updateFollowup(this.data.id, data)
      } else {
        await api.createFollowup(this.data.leadId, data)
      }
      wx.showToast({ title: this.data.isEdit ? '编辑成功' : '新增成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 800)
    } catch (err) {
      console.error('提交失败:', err)
    } finally {
      this.setData({ submitting: false })
    }
  },
})