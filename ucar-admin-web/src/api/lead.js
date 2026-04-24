import request from '@/utils/request'

export const getLeadList = (params) => {
  return request.get('/lead', { params })
}

export const createLead = (data) => {
  return request.post('/lead', data)
}

export const updateLead = (id, data) => {
  return request.put(`/lead/${id}`, data)
}

export const deleteLead = (id) => {
  return request.delete(`/lead/${id}`)
}

export const getLeadDetail = (id) => {
  return request.get(`/lead/${id}`)
}

export const exportLeads = (params) => {
  return request.get('/lead/export', {
    params,
    responseType: 'blob',
  })
}
