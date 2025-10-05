import axios from 'axios'

// 创建 axios 实例用于认证服务
// baseURL 为空，使用相对路径，让 Vite 开发服务器代理请求
const authHttp = axios.create({
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
authHttp.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  },
)

// 响应拦截器
authHttp.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('Auth service error:', error)

    if (!error.response) {
      error.message = '认证服务连接失败，请检查网络设置'
    }
    else {
      const { status, data } = error.response
      switch (status) {
        case 400:
          error.message = data?.message || '请求参数错误'
          break
        case 401:
          error.message = '认证失败'
          break
        case 500:
          error.message = '认证服务器内部错误'
          break
        default:
          error.message = data?.message || '认证请求失败'
      }
    }

    return Promise.reject(error)
  },
)

export { authHttp }
