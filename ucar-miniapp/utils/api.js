const request = require('./request')

module.exports = {
  // 登录（一键登录：code + encryptedData + iv）
  login: (data) => request.post('/auth/login/wechat', data),

  // 概览
  getOverview: () => request.get('/user/overview'),

  // 线索
  getLeads: (params) => request.get('/user/lead', params),

  // 结算
  getSettlements: (params) => request.get('/user/settlement', params),
}
