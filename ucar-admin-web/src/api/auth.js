import request from '@/utils/request'

export const getCaptcha = () => {
  return request.get('/auth/captcha')
}

export const login = (data) => {
  return request.post('/auth/login', data)
}

export const changePassword = (data) => {
  return request.put('/auth/password', data)
}
