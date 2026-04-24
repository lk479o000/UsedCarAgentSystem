const request = require('./request')

module.exports = {
  // 登录
  login: (code) => request.post('/auth/login/wechat', { code }),
  bindPhone: (data) => request.post('/auth/bind-phone', data),

  // 概览
  getOverview: () => request.get('/user/overview'),

  // 线索
  getLeads: (params) => request.get('/user/lead', params),

  // 结算
  getSettlements: (params) => request.get('/user/settlement', params),
}
