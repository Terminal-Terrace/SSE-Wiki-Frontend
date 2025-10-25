// AI 助手相关类型定义

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp?: number
}

export interface AIConfig {
  provider: 'deepseek' | 'openai' | 'qwen' | 'zhipu' | 'kimi'
  apiKey: string
  baseUrl: string
  model: string
  temperature: number
  maxTokens: number
}

export interface StreamCallbacks {
  onChunk: (content: string) => void
  onComplete: () => void
  onError: (error: Error) => void
}

export interface AIProvider {
  name: string
  baseUrl: string
  defaultModel: string
  supportsStreaming: boolean
}

export const AI_PROVIDERS: Record<string, AIProvider> = {
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    supportsStreaming: true,
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-3.5-turbo',
    supportsStreaming: true,
  },
  qwen: {
    name: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
    defaultModel: 'qwen-turbo',
    supportsStreaming: true,
  },
}
