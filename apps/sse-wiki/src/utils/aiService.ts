// AI 服务封装 - 支持 DeepSeek 等 OpenAI 兼容格式的厂商

import type { AIConfig, ChatMessage, StreamCallbacks } from '@/types/ai'
import { AI_PROVIDERS } from '@/types/ai'

/**
 * AI 服务类
 * 负责与 AI 厂商 API 交互
 */
export class AIService {
  private config: AIConfig

  constructor(config?: Partial<AIConfig>) {
    this.config = this.loadConfig(config)
  }

  /**
   * 加载配置
   * 优先级：传入参数 > LocalStorage > 环境变量 > 默认值
   */
  private loadConfig(overrides?: Partial<AIConfig>): AIConfig {
    // 尝试从 LocalStorage 读取
    const stored = localStorage.getItem('ai-config')
    const storedConfig = stored ? JSON.parse(stored) : {}

    // 从环境变量读取
    const provider = (import.meta.env.VITE_AI_PROVIDER || 'deepseek') as AIConfig['provider']
    const providerInfo = AI_PROVIDERS[provider] ?? AI_PROVIDERS.deepseek!

    return {
      provider: overrides?.provider || storedConfig.provider || provider,
      apiKey: overrides?.apiKey || storedConfig.apiKey || import.meta.env.VITE_AI_API_KEY || '',
      baseUrl: overrides?.baseUrl || storedConfig.baseUrl || import.meta.env.VITE_AI_BASE_URL || providerInfo!.baseUrl,
      model: overrides?.model || storedConfig.model || import.meta.env.VITE_AI_MODEL || providerInfo!.defaultModel,
      temperature: overrides?.temperature ?? storedConfig.temperature ?? 0.7,
      maxTokens: overrides?.maxTokens ?? storedConfig.maxTokens ?? 2000,
    }
  }

  /**
   * 保存配置到 LocalStorage
   */
  saveConfig(config: Partial<AIConfig>) {
    this.config = { ...this.config, ...config }
    localStorage.setItem('ai-config', JSON.stringify(this.config))
  }

  /**
   * 获取当前配置
   */
  getConfig(): AIConfig {
    return { ...this.config }
  }

  /**
   * 检查配置是否有效
   */
  isConfigured(): boolean {
    return !!this.config.apiKey && !!this.config.baseUrl
  }

  /**
   * 构建文章上下文系统提示词
   */
  buildArticleContext(title: string, content: string): string {
    // 截取文章内容，避免超出 token 限制
    const maxContentLength = 3000
    const truncatedContent = content.length > maxContentLength
      ? `${content.slice(0, maxContentLength)}\n\n[文章内容较长，已截取前 ${maxContentLength} 字符]`
      : content

    return `你是一个专业的知识助手，当前用户正在阅读一篇文章。

文章标题：《${title}》

文章内容：
${truncatedContent}

你的任务是：
1. 基于上述文章内容回答用户的问题
2. 提供准确、简洁、易懂的解答
3. 如果用户的问题超出文章范围，可以适当扩展知识，但要明确说明
4. 使用中文回答
5. 如果文章内容被截断，可以说明"根据提供的部分内容"来回答

请专注于帮助用户理解和掌握这篇文章的知识。`
  }

  /**
   * 估算文本的 token 数量（粗略估算）
   * 中文：1 字符 ≈ 1.5 tokens
   * 英文：1 单词 ≈ 1.3 tokens
   */
  estimateTokens(text: string): number {
    // 简单估算：中文字符数 + 英文单词数
    const chineseChars = (text.match(/[\u4E00-\u9FA5]/g) || []).length
    const englishWords = text.split(/\s+/).filter(word => /[a-z]/i.test(word)).length

    return Math.ceil(chineseChars * 1.5 + englishWords * 1.3)
  }

  /**
   * 管理对话历史，保留最近的消息，避免超出 token 限制
   */
  trimMessages(messages: ChatMessage[], maxTokens: number = 4000): ChatMessage[] {
    // 保留系统消息
    const systemMessages = messages.filter(m => m.role === 'system')
    const otherMessages = messages.filter(m => m.role !== 'system')

    // 从最新的消息开始保留
    const trimmed: ChatMessage[] = [...systemMessages]
    let totalTokens = systemMessages.reduce((sum, m) => sum + this.estimateTokens(m.content), 0)

    for (let i = otherMessages.length - 1; i >= 0; i--) {
      const msg = otherMessages[i]
      if (!msg)
        continue

      const tokens = this.estimateTokens(msg.content)

      if (totalTokens + tokens > maxTokens) {
        break
      }

      trimmed.splice(systemMessages.length, 0, msg)
      totalTokens += tokens
    }

    return trimmed
  }

  /**
   * 发送消息（流式）
   * 使用 Server-Sent Events (SSE) 实现流式响应
   */
  async sendMessageStream(
    messages: ChatMessage[],
    callbacks: StreamCallbacks,
  ): Promise<void> {
    if (!this.isConfigured()) {
      callbacks.onError(new Error('AI 服务未配置，请先设置 API Key'))
      return
    }

    try {
      // 修剪消息历史
      const trimmedMessages = this.trimMessages(messages)

      // 构建请求
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: trimmedMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          stream: true,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `API 请求失败: ${response.status} ${response.statusText}`)
      }

      // 处理流式响应
      await this.handleStreamResponse(response, callbacks)
    }
    catch (error) {
      console.error('AI service error:', error)
      callbacks.onError(error as Error)
    }
  }

  /**
   * 处理流式响应
   */
  private async handleStreamResponse(
    response: Response,
    callbacks: StreamCallbacks,
  ): Promise<void> {
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法读取响应流')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          callbacks.onComplete()
          break
        }

        // 解码数据块
        buffer += decoder.decode(value, { stream: true })

        // 按行处理
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // 保留不完整的行

        for (const line of lines) {
          const trimmedLine = line.trim()

          if (!trimmedLine || trimmedLine === 'data: [DONE]') {
            continue
          }

          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonStr = trimmedLine.slice(6) // 移除 "data: " 前缀
              const data = JSON.parse(jsonStr)

              // 提取内容
              const content = data.choices?.[0]?.delta?.content
              if (content) {
                callbacks.onChunk(content)
              }

              // 检查是否完成
              const finishReason = data.choices?.[0]?.finish_reason
              if (finishReason) {
                callbacks.onComplete()
                return
              }
            }
            catch (e) {
              console.warn('解析 SSE 数据失败:', trimmedLine, e)
            }
          }
        }
      }
    }
    catch (error) {
      callbacks.onError(error as Error)
    }
    finally {
      reader.releaseLock()
    }
  }

  /**
   * 发送消息（非流式）
   * 适用于不需要流式输出的场景
   */
  async sendMessage(messages: ChatMessage[]): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('AI 服务未配置，请先设置 API Key')
    }

    const trimmedMessages = this.trimMessages(messages)

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: trimmedMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: false,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  }
}

// 导出单例实例
export const aiService = new AIService()

// 默认导出
export default aiService
