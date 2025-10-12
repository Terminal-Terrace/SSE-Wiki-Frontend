// Article/Page types
export interface Page {
  id: string | number
  title: string
  content: string
  lastEditedAt: string
  editor: {
    id: string | number
    username: string
  }
  viewCount: number
  tags: Tag[]
  versions?: PageVersion[]
}

export interface Tag {
  id: string | number
  name: string
}

export interface PageVersion {
  id: string | number
  commitMessage: string
  editor: string
  timestamp: string
  content: string
}

// Re-export module types
export * from './module'
