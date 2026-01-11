import { toCamelCase } from '@/utils/convert'
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

export interface UserInfo {
  userId: number
  username: string
  email?: string
  role?: string
  avatar?: string
}

export interface UpdateProfileRequest {
  avatar?: string
  username?: string
}

const AUTH_BASE_URL = import.meta.env.VITE_AUTH_API_PATH || '/api/v1/auth'

/**
 * 认证API类
 * 包含所有认证相关的API接口调用方法
 */
export class AuthAPI {
  /**
   * 预登录 - 获取 state 用于 CSRF 防护
   * POST /api/v1/auth/prelogin
   * 这个方法在 sse-wiki 应用的登录按钮点击时调用
   *
   * @param redirectUrl 登录成功后的重定向地址
   * @returns Promise<PreLoginResponse> 包含 state 的响应
   */
  static async preLogin(redirectUrl: string): Promise<PreLoginResponse> {
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
   * 获取当前用户信息
   * GET /api/v1/auth/me
   * 从 Cookie 中的 access_token 自动验证用户
   *
   * @returns Promise<UserInfo> 用户信息
   */
  static async getMe(): Promise<UserInfo> {
    const response = await authHttp.get<ApiResponse<UserInfo>>(
      `${AUTH_BASE_URL}/me`,
    )

    if (response.data.code !== 100) {
      throw new Error(response.data.message || '获取用户信息失败')
    }

    return toCamelCase<UserInfo>(response.data.data)
  }

  /**
   * 退出登录
   * POST /api/v1/auth/logout
   * 清除服务器端的 access_token 和 refresh_token Cookie
   *
   * @returns Promise<void>
   */
  static async logout(): Promise<void> {
    const response = await authHttp.post<ApiResponse<null>>(
      `${AUTH_BASE_URL}/logout`,
      {},
    )

    if (response.data.code !== 100) {
      throw new Error(response.data.message || '退出登录失败')
    }
  }

  /**
   * 跳转到认证应用的登录页面
   *
   * @param state CSRF 防护用的 state
   * @param redirectUrl 登录成功后的重定向地址
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

  /**
   * 更新用户资料
   * PATCH /api/v1/auth/profile
   *
   * @param data 更新的资料数据
   * @returns Promise<UserInfo> 更新后的用户信息
   */
  static async updateProfile(data: UpdateProfileRequest): Promise<UserInfo> {
    const response = await authHttp.patch<ApiResponse<UserInfo>>(
      `${AUTH_BASE_URL}/profile`,
      data,
    )

    if (response.data.code !== 100) {
      throw new Error(response.data.message || '更新资料失败')
    }

    return toCamelCase<UserInfo>(response.data.data)
  }
}

// 导出单例实例（可选，根据项目风格决定）
// export const authApi = new AuthAPI()

// 默认导出
export default AuthAPI
