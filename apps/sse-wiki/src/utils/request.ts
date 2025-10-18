import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { toast } from '@sse-wiki/ui'
import axios from 'axios'

// 后端统一响应格式
interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 错误码定义
export const ErrorCode = {
  SUCCESS: 100,
  FAIL: 0,
  PARSE_ERROR: 1,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
} as const

// 创建 axios 实例
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
const request: AxiosInstance = axios.create({
  baseURL: apiBaseUrl, // 使用环境变量或空字符串（Vite 代理）
  timeout: 30000,
  withCredentials: true, // 允许跨域携带 cookie
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // Token 现在通过 HttpOnly Cookie 自动携带，无需手动添加

    // 开发环境打印请求日志
    if (import.meta.env.DEV) {
      console.log('🚀 Request:', {
        url: config.url,
        method: config.method,
        params: config.params,
        data: config.data,
        headers: config.headers,
      })
    }

    return config
  },
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  },
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { code, message, data } = response.data

    // 开发环境打印响应日志
    if (import.meta.env.DEV) {
      console.log('✅ Response:', {
        url: response.config.url,
        code,
        message,
        data,
      })
    }

    // 判断业务状态码
    if (code === ErrorCode.SUCCESS) {
      // 成功：返回 data 部分
      return data
    }
    else if (code === ErrorCode.UNAUTHORIZED) {
      // Token 无效或过期
      toast({
        title: '认证失败',
        description: message || '请重新登录',
        variant: 'destructive',
      })
      handleTokenExpired()
      return Promise.reject(new Error(message || '认证失败'))
    }
    else if (code === ErrorCode.FORBIDDEN) {
      // 权限不足
      toast({
        title: '权限不足',
        description: message || '您没有权限执行此操作',
        variant: 'destructive',
      })
      return Promise.reject(new Error(message || '权限不足'))
    }
    else if (code === ErrorCode.NOT_FOUND) {
      // 资源不存在
      toast({
        title: '资源不存在',
        description: message || '请求的资源不存在',
        variant: 'destructive',
      })
      return Promise.reject(new Error(message || '资源不存在'))
    }
    else {
      // 其他业务错误
      toast({
        title: '操作失败',
        description: message || '请求失败，请稍后重试',
        variant: 'destructive',
      })
      return Promise.reject(new Error(message || '请求失败'))
    }
  },
  (error: AxiosError) => {
    // HTTP 错误（网络错误、超时等）
    console.error('❌ HTTP Error:', error)

    // 409 冲突错误：不显示全局 toast，交给业务代码处理
    if (error.response?.status === 409) {
      return Promise.reject(error)
    }

    let errorMessage = '网络请求失败'
    let errorTitle = '网络错误'

    if (error.response) {
      // 服务器返回错误状态码
      const status = error.response.status

      // 特殊状态码处理
      if (status === 401) {
        errorTitle = '认证失败'
        errorMessage = '请重新登录'
        handleTokenExpired()
      }
      else if (status === 403) {
        errorTitle = '权限不足'
        errorMessage = '您没有权限执行此操作'
      }
      else if (status === 404) {
        errorTitle = '资源不存在'
        errorMessage = '请求的资源不存在'
      }
      else if (status === 500) {
        errorTitle = '服务器错误'
        errorMessage = '服务器内部错误，请稍后重试'
      }
      else {
        errorMessage = `服务器错误 (${status})`
        errorTitle = '服务器错误'
      }
    }
    else if (error.request) {
      // 请求发出但没有收到响应
      errorMessage = '网络连接失败，请检查网络'
      errorTitle = '网络连接失败'
    }
    else {
      // 请求配置出错
      errorMessage = error.message || '请求配置错误'
      errorTitle = '请求错误'
    }

    toast({
      title: errorTitle,
      description: errorMessage,
      variant: 'destructive',
    })

    return Promise.reject(error)
  },
)

// Token 过期处理（不刷新，只清除）
function handleTokenExpired() {
  // 清除本地 token（如果有的话）
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')

  // Cookie 会由后端自动清除或过期

  // 延迟重定向到登录页，避免在拦截器中立即调用
  setTimeout(async () => {
    // 动态导入避免循环依赖
    const { useLoginRedirect } = await import('@/composables/useLoginRedirect')
    const { startLogin } = useLoginRedirect()
    await startLogin()
  }, 500)
}

// 导出配置好的实例
export default request

// 导出类型
export type { ApiResponse, AxiosRequestConfig }
