import request from '@/utils/request'

export const getDashboardOverview = () => {
  return request.get('/dashboard/overview')
}

export const getDashboardAnalytics = (range = 30) => {
  return request.get('/dashboard/analytics', { params: { range } })
}
