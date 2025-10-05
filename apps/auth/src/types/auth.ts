// 预登录请求
export interface PreLoginRequest {
  redirect_url: string
}

// 预登录响应
export interface PreLoginResponse {
  state: string
}

// 登录请求
export interface LoginRequest {
  type: 'sse-wiki' | 'github' | 'sse-market'
  state: string
  username?: string
  password?: string
  code?: string
}

// 登录响应
export interface LoginResponse {
  redirect_url: string
}

// API 响应包装
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 用户信息
export interface User {
  id: number
  username: string
  email?: string
  avatar?: string
  role?: string
}
