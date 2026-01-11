import type {
  AddModeratorRequest,
  ArticleListResponse,
  BreadcrumbItem,
  CreateModuleRequest,
  DeleteModuleResponse,
  LockRequest,
  LockResponse,
  Module,
  ModuleModerator,
  ModuleTreeNode,
  UpdateModuleRequest,
} from '@/types/module'
import { toCamelCase } from '@/utils/convert'
import request from '@/utils/request'

/**
 * 模块管理API类
 * 包含所有模块相关的API接口调用方法
 */
export class ModuleAPI {
  private readonly baseURL = '/api/v1/modules'

  /**
   * 获取完整的模块层级树
   * GET /api/v1/modules
   *
   * @returns Promise<ModuleTreeNode[]> 模块树数组
   */
  async getModuleTree(): Promise<ModuleTreeNode[]> {
    const data = await request.get(this.baseURL)
    return toCamelCase<ModuleTreeNode[]>(data || [])
  }

  /**
   * 获取单个模块信息
   * GET /api/v1/modules/:moduleId
   *
   * @param moduleId 模块ID
   * @returns Promise<Module> 模块详细信息
   */
  async getModule(moduleId: number | string): Promise<Module> {
    const data = await request.get(`${this.baseURL}/${moduleId}`)
    return toCamelCase<Module>(data)
  }

  /**
   * 获取模块面包屑导航
   * GET /api/v1/modules/:moduleId/breadcrumbs
   *
   * @param moduleId 模块ID
   * @returns Promise<BreadcrumbItem[]> 面包屑路径
   */
  async getBreadcrumbs(moduleId: number | string): Promise<BreadcrumbItem[]> {
    const data = await request.get(`${this.baseURL}/${moduleId}/breadcrumbs`)
    return toCamelCase<BreadcrumbItem[]>(data || [])
  }

  /**
   * 获取模块下的文章列表
   * GET /api/v1/modules/:moduleId/articles
   * 注意：后端未实现此接口
   *
   * @param moduleId 模块ID
   * @param params 查询参数
   * @param params.page 页码，从1开始
   * @param params.pageSize 每页大小
   * @returns Promise<ArticleListResponse> 文章列表响应
   */
  async getArticles(
    moduleId: number | string,
    params?: { page?: number, pageSize?: number },
  ): Promise<ArticleListResponse> {
    const data = await request.get(`${this.baseURL}/${moduleId}/articles`, { params })
    return toCamelCase<ArticleListResponse>(data)
  }

  /**
   * 创建新模块
   * POST /api/v1/modules
   *
   * @param data 创建模块的数据
   * @returns Promise<Module> 创建的模块信息
   */
  async createModule(data: CreateModuleRequest): Promise<Module> {
    // 将 camelCase 转换为 snake_case 以匹配 BFF 期望
    const requestData = {
      name: data.name,
      description: data.description,
      parent_id: data.parentId ?? undefined,
    }
    const response = await request.post(this.baseURL, requestData)
    return toCamelCase<Module>(response)
  }

  /**
   * 更新模块信息
   * PUT /api/v1/modules/:id
   *
   * @param id 模块ID
   * @param data 更新的数据
   * @returns Promise<Module> 更新后的模块信息
   */
  async updateModule(id: number | string, data: UpdateModuleRequest): Promise<Module> {
    // 确保 id 是数字类型
    const moduleId = typeof id === 'string' ? Number(id) : id
    if (Number.isNaN(moduleId)) {
      throw new TypeError(`Invalid module ID: ${id}`)
    }
    // 将 camelCase 转换为 snake_case 以匹配 BFF 期望
    const requestData: any = {}
    if (data.name !== undefined)
      requestData.name = data.name
    if (data.description !== undefined)
      requestData.description = data.description
    if (data.parentId !== undefined)
      requestData.parent_id = data.parentId
    const response = await request.put(`${this.baseURL}/${moduleId}`, requestData)
    return toCamelCase<Module>(response)
  }

  /**
   * 删除模块
   * DELETE /api/v1/modules/:id
   *
   * @param id 模块ID
   * @returns Promise<DeleteModuleResponse> 删除操作结果
   */
  async deleteModule(id: number | string): Promise<DeleteModuleResponse> {
    // 确保 id 是数字类型
    const moduleId = typeof id === 'string' ? Number(id) : id
    if (Number.isNaN(moduleId)) {
      throw new TypeError(`Invalid module ID: ${id}`)
    }
    const data = await request.delete(`${this.baseURL}/${moduleId}`)
    return toCamelCase<DeleteModuleResponse>(data)
  }

  /**
   * 获取/操作编辑锁
   * POST /api/v1/modules/lock
   *
   * @param data 锁操作数据
   * @returns Promise<LockResponse> 锁操作结果
   */
  async manageLock(data: LockRequest): Promise<LockResponse> {
    const response = await request.post(`${this.baseURL}/lock`, data)
    return toCamelCase<LockResponse>(response)
  }

  /**
   * 获取锁状态
   * GET /api/v1/modules/lock
   * 注意：后端可能未实现此接口，请确认
   *
   * @returns Promise<LockResponse> 当前锁状态
   */
  async getLockStatus(): Promise<LockResponse> {
    const data = await request.get(`${this.baseURL}/lock`)
    return toCamelCase<LockResponse>(data)
  }

  /**
   * 获取模块协作者列表
   * GET /api/v1/modules/:id/moderators
   *
   * @param moduleId 模块ID
   * @returns Promise<ModuleModerator[]> 协作者列表
   */
  async getModerators(moduleId: number | string): Promise<ModuleModerator[]> {
    const data = await request.get(`${this.baseURL}/${moduleId}/moderators`)
    return toCamelCase<ModuleModerator[]>(data || [])
  }

  /**
   * 添加协作者
   * POST /api/v1/modules/:id/moderators
   *
   * @param moduleId 模块ID
   * @param data 协作者数据
   * @returns Promise<ModuleModerator> 添加的协作者信息
   */
  async addModerator(moduleId: number | string, data: AddModeratorRequest): Promise<ModuleModerator> {
    const response = await request.post(`${this.baseURL}/${moduleId}/moderators`, data)
    return toCamelCase<ModuleModerator>(response)
  }

  /**
   * 移除协作者
   * DELETE /api/v1/modules/:id/moderators/:userId
   *
   * @param moduleId 模块ID
   * @param userId 用户ID
   * @returns Promise<{ success: boolean }> 操作结果
   */
  async removeModerator(moduleId: number | string, userId: number): Promise<{ success: boolean }> {
    return request.delete(`${this.baseURL}/${moduleId}/moderators/${userId}`)
  }

  // 便捷方法

  /**
   * 获取编辑锁
   */
  async acquireLock(): Promise<LockResponse> {
    return this.manageLock({ action: 'acquire' })
  }

  /**
   * 释放编辑锁
   */
  async releaseLock(): Promise<LockResponse> {
    return this.manageLock({ action: 'release' })
  }
}

// 导出单例实例
export const moduleApi = new ModuleAPI()

// 默认导出
export default moduleApi
