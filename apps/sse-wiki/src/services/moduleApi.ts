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
// 模块管理 API 服务
import request from '@/utils/request'

/**
 * 模块管理API类
 * 包含所有模块相关的API接口调用方法
 */
export class ModuleAPI {
  private baseURL = '/api/v1/modules'

  /**
   * 获取完整的模块层级树
   * GET /api/v1/modules
   *
   * @returns Promise<ModuleTreeNode[]> 模块树数组
   */
  async getModuleTree(): Promise<ModuleTreeNode[]> {
    const data: any[] = await request.get(this.baseURL)
    // 转换字段名：is_moderator -> isModerator（后端返回 snake_case，前端使用 camelCase）
    return this.transformModuleTree(data || [])
  }

  /**
   * 递归转换模块树字段名
   */
  private transformModuleTree(nodes: any[]): ModuleTreeNode[] {
    return nodes.map((node) => {
      const { is_moderator, children, ...rest } = node
      return {
        ...rest,
        isModerator: is_moderator,
        children: children ? this.transformModuleTree(children) : [],
      }
    })
  }

  /**
   * 获取单个模块信息
   * GET /api/v1/modules/:moduleId
   *
   * @param moduleId 模块ID
   * @returns Promise<Module> 模块详细信息
   */
  async getModule(moduleId: number | string): Promise<Module> {
    return request.get(`${this.baseURL}/${moduleId}`)
  }

  /**
   * 获取模块面包屑导航
   * GET /api/v1/modules/:moduleId/breadcrumbs
   *
   * @param moduleId 模块ID
   * @returns Promise<BreadcrumbItem[]> 面包屑路径
   */
  async getBreadcrumbs(moduleId: number | string): Promise<BreadcrumbItem[]> {
    return request.get(`${this.baseURL}/${moduleId}/breadcrumbs`)
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
    return request.get(`${this.baseURL}/${moduleId}/articles`, { params })
  }

  /**
   * 创建新模块
   * POST /api/v1/modules
   *
   * @param data 创建模块的数据
   * @returns Promise<Module> 创建的模块信息
   */
  async createModule(data: CreateModuleRequest): Promise<Module> {
    return request.post(this.baseURL, data)
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
    return request.put(`${this.baseURL}/${id}`, data)
  }

  /**
   * 删除模块
   * DELETE /api/v1/modules/:id
   *
   * @param id 模块ID
   * @returns Promise<DeleteModuleResponse> 删除操作结果
   */
  async deleteModule(id: number | string): Promise<DeleteModuleResponse> {
    return request.delete(`${this.baseURL}/${id}`)
  }

  /**
   * 获取/操作编辑锁
   * POST /api/v1/modules/lock
   *
   * @param data 锁操作数据
   * @returns Promise<LockResponse> 锁操作结果
   */
  async manageLock(data: LockRequest): Promise<LockResponse> {
    // 后端返回格式：{ code: 100, message: 'success', data: { success: true, locked_by, locked_at } }
    // request.ts 已处理，直接返回 data 部分
    return request.post(`${this.baseURL}/lock`, data)
  }

  /**
   * 获取锁状态
   * GET /api/v1/modules/lock
   * 注意：后端可能未实现此接口，请确认
   *
   * @returns Promise<LockResponse> 当前锁状态
   */
  async getLockStatus(): Promise<LockResponse> {
    return request.get(`${this.baseURL}/lock`)
  }

  /**
   * 获取模块协作者列表
   * GET /api/v1/modules/:id/moderators
   *
   * @param moduleId 模块ID
   * @returns Promise<ModuleModerator[]> 协作者列表
   */
  async getModerators(moduleId: number | string): Promise<ModuleModerator[]> {
    return request.get(`${this.baseURL}/${moduleId}/moderators`)
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
    return request.post(`${this.baseURL}/${moduleId}/moderators`, data)
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
