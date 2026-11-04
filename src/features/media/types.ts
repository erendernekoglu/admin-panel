export interface BlogPostStats {
  views: number
  likes: number
  comments: number
  bookmarks: number
  readingTime: number
}

export interface BlogAuthor {
  displayName: string
  username: string

}

export interface BlogPost {
  id: string
  title: string
  author: BlogAuthor
  category: string
  status: string
  stats: BlogPostStats
  publishedAt: string | null
  createdAt: string
}


export interface MediaAnalyticsSummary {
  totalPosts: number
  totalComments: number
  totalFollows: number
  totalNotifications: number
}

export interface MediaAnalyticsResponse {
  posts: BlogPost[]
  summary: MediaAnalyticsSummary
  sample: {
    limit: number
    truncated: boolean
  }
}
