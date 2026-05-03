const request = require('./request')

module.exports = {
  login: (data) => request.post('/auth/login/wechat', data),
  loginByAccount: (data) => request.post('/auth/login', data),
  getCaptcha: () => request.get('/auth/captcha'),
  decryptPhone: (data) => request.post('/auth/decrypt-phone', data),

  getOverview: () => request.get('/user/overview'),
  getMe: () => request.get('/user/me'),
  updateMe: (data) => request.put('/user/me', data),

  getLeads: (params) => request.get('/user/lead', params),
  getAdminLeads: (params) => request.get('/lead', params),
  getLeadDetail: (id) => request.get(`/lead/${id}`),
  createLead: (data) => request.post('/lead', data),
  updateLead: (id, data) => request.put(`/lead/${id}`, data),
  deleteLead: (id) => request.del(`/lead/${id}`),
  updateLeadStatus: (id, data) => request.put(`/lead/${id}`, data),

  getFollowups: (leadId) => request.get(`/lead/${leadId}/followup`),
  createFollowup: (leadId, data) => request.post(`/lead/${leadId}/followup`, data),
  updateFollowup: (id, data) => request.put(`/lead/followup/${id}`, data),
  deleteFollowup: (id) => request.del(`/lead/followup/${id}`),

  getSettlements: (params) => request.get('/user/settlement', params),
  getAdminSettlements: (params) => request.get('/settlement', params),
  getSettlementDetail: (id) => request.get(`/settlement/${id}`),
  getSettlementByLead: (leadId) => request.get(`/settlement/lead/${leadId}`),
  createSettlement: (data) => request.post('/settlement', data),
  updateSettlement: (id, data) => request.put(`/settlement/${id}`, data),

  getAgents: (params) => request.get('/user/agents', params),

  getProvinces: () => request.get('/region/provinces'),
  getCities: (provinceId) => request.get(`/region/cities/${provinceId}`),
  getDistricts: (cityId) => request.get(`/region/districts/${cityId}`),

  changePassword: (data) => request.put('/user/password', data),
  bindPhone: (data) => request.post('/user/bind-phone', data),
}
