// 用户管理 API 服务
import request from '@/utils/request'

/**
 * 公开用户信息（不含 email）
 */
export interface PublicUserInfo {
  id: number
  username: string
  avatar: string
}

/**
 * 用户搜索响应
 */
export interface SearchUsersResponse {
  users: PublicUserInfo[]
  total: number
  page: number
  page_size: number
}

/**
 * 用户搜索参数
 */
export interface SearchUsersParams {
  keyword: string
  page?: number
  page_size?: number
}

/**
 * 用户管理 API 类
 */
export class UserAPI {
  private baseURL = '/api/v1/users'

  /**
   * 搜索用户
   * GET /api/v1/users/search
   *
   * @param params 搜索参数
   * @returns Promise<SearchUsersResponse> 搜索结果
   */
  async searchUsers(params: SearchUsersParams): Promise<SearchUsersResponse> {
    return request.get(`${this.baseURL}/search`, { params })
  }

  /**
   * 获取用户公开信息
   * GET /api/v1/users/:id
   *
   * @param userId 用户ID
   * @returns Promise<PublicUserInfo> 用户公开信息
   */
  async getUserById(userId: number | string): Promise<PublicUserInfo> {
    return request.get(`${this.baseURL}/${userId}`)
  }
}

// 导出单例实例
export const userApi = new UserAPI()

// 默认导出
export default userApi
