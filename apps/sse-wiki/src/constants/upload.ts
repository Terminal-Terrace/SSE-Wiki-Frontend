/**
 * 文件上传相关常量配置
 */

/**
 * 分块上传的块大小（2MB）
 */
export const CHUNK_SIZE = 2 * 1024 * 1024

/**
 * 最大并发上传数（可根据网络调整，建议3-5）
 */
export const MAX_CONCURRENT = 5

/**
 * 文件大小限制（50MB，可根据需要调整）
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024

/**
 * 允许上传的文件类型
 */
export const ALLOWED_FILE_TYPES = [
  // 图片
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // 视频
  'video/mp4',
  'video/webm',
  'video/quicktime',
  // 音频
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  // 文档
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/markdown',
  // 压缩包
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  // 代码
  'text/javascript',
  'application/json',
  'text/xml',
  'text/html',
]
