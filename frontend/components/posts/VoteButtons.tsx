'use client'

import { useState } from 'react'
import { 
  HandThumbUpIcon, 
  HandThumbDownIcon 
} from '@heroicons/react/24/outline'
import { 
  HandThumbUpIcon as HandThumbUpIconSolid, 
  HandThumbDownIcon as HandThumbDownIconSolid 
} from '@heroicons/react/24/solid'

interface VoteButtonsProps {
  postId?: string
  commentId?: string
  score: number
  upvotes: number
  downvotes: number
  userVote?: number // -1 for downvote, 1 for upvote, 0 for no vote
  onVote?: (voteType: number) => void
  size?: 'sm' | 'md' | 'lg'
}

export default function VoteButtons({ 
  postId, 
  commentId, 
  score, 
  upvotes, 
  downvotes, 
  userVote = 0, 
  onVote,
  size = 'md'
}: VoteButtonsProps) {
  const [localVote, setLocalVote] = useState(userVote)
  const [localScore, setLocalScore] = useState(score)
  const [loading, setLoading] = useState(false)

  const handleVote = async (voteType: number) => {
    if (loading) return

    // Optimistic update
    const newVote = localVote === voteType ? 0 : voteType
    const scoreChange = newVote - localVote
    setLocalVote(newVote)
    setLocalScore(localScore + scoreChange)
    setLoading(true)

    try {
      if (onVote) {
        // Use callback if provided (for comments)
        onVote(newVote)
      } else if (postId) {
        // Direct API call for posts
        const response = await fetch(`/api/posts/${postId}/vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ vote_type: newVote }),
        })

        if (!response.ok) {
          throw new Error('Vote failed')
        }

        const data = await response.json()
        setLocalScore(data.score)
        setLocalVote(data.user_vote)
      }
    } catch (error) {
      console.error('Fehler beim Abstimmen:', error)
      // Revert optimistic update
      setLocalVote(userVote)
      setLocalScore(score)
    } finally {
      setLoading(false)
    }
  }

  const isUpvoted = localVote === 1
  const isDownvoted = localVote === -1

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const iconSize = sizeClasses[size]

  return (
    <div className="flex flex-col items-center space-y-1">
      <button
        onClick={() => handleVote(1)}
        disabled={loading}
        className={`vote-button ${isUpvoted ? 'vote-button-active-up' : 'vote-button-up'}`}
        title="Upvote"
      >
        {isUpvoted ? (
          <HandThumbUpIconSolid className={iconSize} />
        ) : (
          <HandThumbUpIcon className={iconSize} />
        )}
      </button>
      
      <span className={`text-sm font-medium min-w-[2rem] text-center ${
        localScore > 0 ? 'text-green-400' : 
        localScore < 0 ? 'text-red-400' : 
        'text-gray-500'
      }`}>
        {localScore}
      </span>
      
      <button
        onClick={() => handleVote(-1)}
        disabled={loading}
        className={`vote-button ${isDownvoted ? 'vote-button-active-down' : 'vote-button-down'}`}
        title="Downvote"
      >
        {isDownvoted ? (
          <HandThumbDownIconSolid className={iconSize} />
        ) : (
          <HandThumbDownIcon className={iconSize} />
        )}
      </button>
    </div>
  )
}
