import request from '@/utils/request'

export const getDashboardStats = () => {
  return request.get('/user/overview')
}
