import axios from 'axios'

// 创建 axios 实例
// baseURL 为空，使用相对路径，让 Vite 开发服务器代理请求
const http = axios.create({
  baseURL: '',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
  withCredentials: true, // 允许跨域携带 cookie
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    // 可以在这里添加全局请求头
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  },
)

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('Response error:', error)

    // 处理网络错误
    if (!error.response) {
      error.message = '网络连接失败，请检查网络设置'
    }
    else {
      // 处理 HTTP 错误
      const { status, data } = error.response
      switch (status) {
        case 400:
          error.message = data?.message || '请求参数错误'
          break
        case 401:
          error.message = '认证失败，请重新登录'
          break
        case 403:
          error.message = '没有权限访问'
          break
        case 404:
          error.message = '请求的资源不存在'
          break
        case 500:
          error.message = '服务器内部错误'
          break
        default:
          error.message = data?.message || '请求失败'
      }
    }

    return Promise.reject(error)
  },
)

export { http }
