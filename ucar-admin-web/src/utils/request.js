import axios from 'axios'
import { useUserStore } from '@/store/user'
import { Message } from '@/composables/useMessage'

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
})

request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response) => {
    // 如果是blob类型响应，直接返回response
    if (response.config.responseType === 'blob') {
      return response.data
    }
    const res = response.data
    if (res.code !== 0) {
      Message.error(res.message || '请求失败')
      if (res.code === 2) {
        const userStore = useUserStore()
        userStore.logout()
        window.location.href = '/login'
      }
      return Promise.reject(new Error(res.message))
    }
    return res
  },
  (error) => {
    Message.error(error.response?.data?.message || '网络错误')
    return Promise.reject(error)
  }
)

export default request
