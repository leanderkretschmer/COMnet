'use client'

import Link from 'next/link'
import { useMutation, useQueryClient } from 'react-query'
import { api } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { UserGroupIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

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
  is_member?: boolean
  user_role?: string
}

interface CommunityCardProps {
  community: Community
  showJoinButton?: boolean
}

export function CommunityCard({ community, showJoinButton = true }: CommunityCardProps) {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const timeAgo = formatDistanceToNow(new Date(community.created_at), { 
    addSuffix: true, 
    locale: de 
  })

  const joinMutation = useMutation(
    () => api.post(`/communities/${community.id}/join`),
    {
      onSuccess: () => {
        toast.success('Community erfolgreich beigetreten')
        queryClient.invalidateQueries(['communities'])
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Fehler beim Beitreten')
      }
    }
  )

  const leaveMutation = useMutation(
    () => api.post(`/communities/${community.id}/leave`),
    {
      onSuccess: () => {
        toast.success('Community erfolgreich verlassen')
        queryClient.invalidateQueries(['communities'])
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Fehler beim Verlassen')
      }
    }
  )

  const handleJoinLeave = () => {
    if (community.is_member) {
      leaveMutation.mutate()
    } else {
      joinMutation.mutate()
    }
  }

  return (
    <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200">
      {/* Community Icon */}
      <div className="flex-shrink-0">
        {community.icon_url ? (
          <img
            className="h-10 w-10 rounded-full"
            src={community.icon_url}
            alt={community.display_name}
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary-600 font-semibold">
              {community.display_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Community Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <Link 
            href={`/c/${community.name}`}
            className="font-medium text-gray-900 hover:text-primary-600 truncate"
          >
            c/{community.name}
          </Link>
          {community.is_nsfw && (
            <span className="badge badge-danger badge-sm">NSFW</span>
          )}
        </div>
        
        <p className="text-sm text-gray-500 truncate">
          {community.description || 'Keine Beschreibung verfügbar'}
        </p>
        
        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
          <div className="flex items-center space-x-1">
            <UserGroupIcon className="h-3 w-3" />
            <span>{community.member_count} Mitglieder</span>
          </div>
          <div className="flex items-center space-x-1">
            <DocumentTextIcon className="h-3 w-3" />
            <span>{community.post_count} Beiträge</span>
          </div>
          <span>vor {timeAgo}</span>
        </div>
      </div>

      {/* Join/Leave Button */}
      {showJoinButton && isAuthenticated && (
        <div className="flex-shrink-0">
          {community.is_member ? (
            <button
              onClick={handleJoinLeave}
              disabled={leaveMutation.isLoading}
              className="btn btn-secondary btn-sm"
            >
              {leaveMutation.isLoading ? '...' : 'Verlassen'}
            </button>
          ) : (
            <button
              onClick={handleJoinLeave}
              disabled={joinMutation.isLoading || !community.is_public}
              className="btn btn-primary btn-sm"
            >
              {joinMutation.isLoading ? '...' : 'Beitreten'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
