import axios from 'axios'
import { useUserStore } from '@/store/user'
import { Message } from '@/composables/useMessage'
import { getErrorMessage, getMessageType } from '@/utils/errorCode'

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
      // 根据错误码获取错误消息和类型
      const errorMessage = getErrorMessage(res.code, res.message || '请求失败')
      const messageType = getMessageType(res.code)
      Message[messageType](errorMessage)
      
      // 特殊处理：登录过期
      if (res.code === 2) {
        const userStore = useUserStore()
        userStore.logout()
        window.location.href = '/login'
      }
      return Promise.reject(new Error(errorMessage))
    }
    return res
  },
  (error) => {
    // 网络错误处理
    let errorMessage = error.response?.data?.message || error.message || '网络错误'
    
    // 处理HTTP状态码错误
    if (error.response?.status === 429) {
      errorMessage = '请求过于频繁，请稍后再试'
    }
    
    Message.error(errorMessage)
    return Promise.reject(error)
  }
)

export default request
