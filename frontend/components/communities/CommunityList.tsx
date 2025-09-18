'use client'

import { useQuery } from 'react-query'
import { api } from '@/lib/api'
import { CommunityCard } from './CommunityCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface Community {
  id: string
  name: string
  display_name: string
  description: string
  icon_url?: string
  banner_url?: string
  is_public: boolean
  is_nsfw: boolean
  created_at: string
  creator_username: string
  creator_display_name: string
  member_count: number
  post_count: number
}

interface CommunityListProps {
  limit?: number
  showJoinButton?: boolean
}

export function CommunityList({ limit = 10, showJoinButton = true }: CommunityListProps) {
  const { data: communities, isLoading, error } = useQuery<Community[]>(
    ['communities', 'list', limit],
    async () => {
      const response = await api.get(`/communities?limit=${limit}`)
      return response.data.communities || []
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Fehler beim Laden der Communities</p>
      </div>
    )
  }

  if (!communities || communities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Keine Communities gefunden</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {communities.map((community) => (
        <CommunityCard 
          key={community.id} 
          community={community} 
          showJoinButton={showJoinButton}
        />
      ))}
    </div>
  )
}
