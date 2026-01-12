// Article/Page types
import type { ArticleDetailResponse } from './article'

export interface Page extends Omit<ArticleDetailResponse, 'currentVersion' | 'currentUserRole' | 'createdBy' | 'createdAt' | 'updatedAt' | 'currentVersionId' | 'isReviewRequired' | 'viewCount' | 'tags'> {
  createdAt?: string
  updatedAt?: string
  viewCount?: number
  currentUserRole?: string | null
  isReviewRequired?: boolean
  isAuthor?: boolean
  canDelete?: boolean
  createdBy?: number
  editor?: {
    id: number | string
    username: string
  }
  versions?: PageVersion[]
  currentVersionId?: number | null
  currentVersion?: ArticleDetailResponse['currentVersion']
  tags?: string[]
  lastEditedAt?: string
}

export interface PageVersion {
  id: string | number
  commitMessage?: string
  editor?: string
  timestamp?: string
  content?: string
  author?: {
    id: number
    username: string
  }
  createdAt?: string
}

// Re-export module types
export * from './module'
