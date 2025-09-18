'use client'

import { useQuery } from 'react-query'
import { api } from '@/lib/api'
import { PostCard } from './PostCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface Post {
  id: string
  title: string
  content: string
  content_type: string
  media_urls: string[]
  author_id: string
  community_id: string
  network_id: string
  is_pinned: boolean
  is_locked: boolean
  is_nsfw: boolean
  upvotes: number
  downvotes: number
  score: number
  comment_count: number
  created_at: string
  updated_at: string
  author: {
    username: string
    display_name: string
    avatar_url?: string
  }
  community: {
    name: string
    display_name: string
    icon_url?: string
  }
}

export function PostList() {
  const { data: posts, isLoading, error } = useQuery<Post[]>(
    ['posts', 'list'],
    async () => {
      const response = await api.get('/posts')
      return response.data.posts || []
    },
    {
      staleTime: 30 * 1000, // 30 seconds
    }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Fehler beim Laden der Beiträge</p>
      </div>
    )
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Noch keine Beiträge vorhanden</p>
        <p className="text-sm text-gray-400 mt-1">
          Seien Sie der Erste, der einen Beitrag verfasst!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
