import type {
  ApiResponse,
  LoginResponse,
  PreLoginResponse,
} from '../types/auth'
import { http } from '../utils/http'

const AUTH_BASE_URL = import.meta.env.VITE_AUTH_API_PATH || '/api/v1/auth'

export class AuthAPI {
  /**
   * 预登录 - 获取 state 用于 CSRF 防护
   */
  static async prelogin(redirectUrl: string): Promise<PreLoginResponse> {
    const response = await http.post<ApiResponse<PreLoginResponse>>(
      `${AUTH_BASE_URL}/prelogin`,
      { redirect_url: redirectUrl },
    )

    if (response.data.code !== 100) {
      throw new Error(response.data.message || '预登录失败')
    }

    return response.data.data
  }

  /**
   * SSE-Wiki 用户名密码登录
   */
  static async loginWithPassword(
    state: string,
    username: string,
    password: string,
  ): Promise<LoginResponse> {
    const requestData = {
      type: 'sse-wiki',
      state,
      username,
      password,
    }

    const response = await http.post<ApiResponse<LoginResponse>>(
      `${AUTH_BASE_URL}/login`,
      requestData,
    )

    if (response.data.code !== 100) {
      throw new Error(response.data.message || '登录失败')
    }

    return response.data.data
  }

  /**
   * GitHub OAuth 登录
   */
  static async loginWithGitHub(
    state: string,
    code: string,
  ): Promise<LoginResponse> {
    const response = await http.post<ApiResponse<LoginResponse>>(
      `${AUTH_BASE_URL}/login`,
      {
        type: 'github',
        state,
        code,
      },
    )

    if (response.data.code !== 100) {
      throw new Error(response.data.message || 'GitHub登录失败')
    }

    return response.data.data
  }
}
