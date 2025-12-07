import request from '@/utils/request'

export interface InitUploadResponse {
  exists: boolean
  fileId?: string
  uploadId?: string
  url?: string
}

interface SignUploadResponse {
  url: string
}

export interface CompleteUploadResponse {
  fileId: string
  url: string
}

export function initUpload(params: {
  fileHash: string
  fileName: string
  fileSize: number
  mimeType: string
}): Promise<InitUploadResponse> {
  return request.post('/api/v1/files/upload/init', params)
}

export async function getUploadPartUrl(params: {
  uploadId: string
  partNumber: number
}): Promise<string> {
  const res: SignUploadResponse = await request.post('/api/v1/files/upload/sign', params)
  return res.url
}

export function completeUpload(params: { uploadId: string }): Promise<CompleteUploadResponse> {
  return request.post('/api/v1/files/upload/complete', params)
}
