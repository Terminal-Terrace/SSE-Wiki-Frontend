import { authHttp } from '../utils/authHttp'

// 类型定义
export interface PreLoginRequest {
  redirect_url: string
}

export interface PreLoginResponse {
  state?: string
  redirect_url?: string
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

const AUTH_BASE_URL = import.meta.env.VITE_AUTH_API_PATH || '/api/v1/auth'

export class AuthService {
  /**
   * 预登录 - 获取 state 用于 CSRF 防护
   * 这个方法在 sse-wiki 应用的登录按钮点击时调用
   */
  static async prelogin(redirectUrl: string): Promise<PreLoginResponse> {
    const response = await authHttp.post<ApiResponse<PreLoginResponse>>(
      `${AUTH_BASE_URL}/prelogin`,
      { redirect_url: redirectUrl },
    )

    if (response.data.code !== 100) {
      throw new Error(response.data.message || '预登录失败')
    }

    // 如果后端没有返回 state，我们自己生成一个
    // TODO: 这里是否正确? 如果没有返回state可能需要报错
    if (!response.data.data.state) {
      response.data.data.state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }

    return response.data.data
  }

  /**
   * 跳转到认证应用的登录页面
   */
  static redirectToLogin(state: string, redirectUrl: string) {
    const authAppUrl = import.meta.env.VITE_AUTH_APP_URL
    if (!authAppUrl) {
      throw new Error('认证应用地址未配置，请检查 .env 文件中的 VITE_AUTH_APP_URL')
    }
    const loginUrl = new URL('/login', authAppUrl)

    loginUrl.searchParams.set('state', state)
    loginUrl.searchParams.set('redirect', encodeURIComponent(redirectUrl))

    window.location.href = loginUrl.toString()
  }
}
