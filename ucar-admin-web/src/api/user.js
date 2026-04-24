import request from '@/utils/request'

export const getUserList = (params) => {
  return request.get('/user', { params })
}

export const createUser = (data) => {
  return request.post('/user', data)
}

export const updateUser = (id, data) => {
  return request.put(`/user/${id}`, data)
}

export const getAgentLeads = (params) => {
  return request.get('/user/lead', { params })
}

export const getAgentSettlements = (params) => {
  return request.get('/user/settlement', { params })
}
