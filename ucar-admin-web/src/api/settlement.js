import request from '@/utils/request'

export const getSettlementList = (params) => {
  return request.get('/settlement', { params })
}

export const createSettlement = (data) => {
  return request.post('/settlement', data)
}

export const updateSettlement = (id, data) => {
  return request.put(`/settlement/${id}`, data)
}

export const pushNotify = (id) => {
  return request.post(`/settlement/${id}/notify`)
}

export const exportSettlements = (params) => {
  return request.get('/settlement/export', {
    params,
    responseType: 'blob',
  })
}

export const getSettlementByLeadId = (leadId) => {
  return request.get(`/settlement/lead/${leadId}`)
}
