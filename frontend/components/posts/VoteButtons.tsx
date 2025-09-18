'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { api } from '@/lib/api'
import { 
  HandThumbUpIcon, 
  HandThumbDownIcon 
} from '@heroicons/react/24/outline'
import { 
  HandThumbUpIcon as HandThumbUpIconSolid, 
  HandThumbDownIcon as HandThumbDownIconSolid 
} from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

interface VoteButtonsProps {
  postId: string
  score: number
  upvotes: number
  downvotes: number
  userVote?: number // -1 for downvote, 1 for upvote, 0 for no vote
}

export function VoteButtons({ postId, score, upvotes, downvotes, userVote = 0 }: VoteButtonsProps) {
  const [localVote, setLocalVote] = useState(userVote)
  const [localScore, setLocalScore] = useState(score)
  const queryClient = useQueryClient()

  const voteMutation = useMutation(
    (voteType: number) => api.post(`/posts/${postId}/vote`, { vote_type: voteType }),
    {
      onSuccess: (response) => {
        const { score: newScore, user_vote } = response.data
        setLocalScore(newScore)
        setLocalVote(user_vote)
        queryClient.invalidateQueries(['posts'])
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Fehler beim Abstimmen')
        // Revert local changes
        setLocalVote(userVote)
        setLocalScore(score)
      }
    }
  )

  const handleVote = (voteType: number) => {
    // Optimistic update
    const newVote = localVote === voteType ? 0 : voteType
    const scoreChange = newVote - localVote
    setLocalVote(newVote)
    setLocalScore(localScore + scoreChange)

    voteMutation.mutate(newVote)
  }

  const isUpvoted = localVote === 1
  const isDownvoted = localVote === -1

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleVote(1)}
        disabled={voteMutation.isLoading}
        className={`vote-button ${isUpvoted ? 'vote-button-active-up' : 'vote-button-up'}`}
        title="Upvote"
      >
        {isUpvoted ? (
          <HandThumbUpIconSolid className="h-4 w-4" />
        ) : (
          <HandThumbUpIcon className="h-4 w-4" />
        )}
      </button>
      
      <span className={`text-sm font-medium min-w-[2rem] text-center ${
        localScore > 0 ? 'text-success-600' : 
        localScore < 0 ? 'text-danger-600' : 
        'text-gray-500'
      }`}>
        {localScore}
      </span>
      
      <button
        onClick={() => handleVote(-1)}
        disabled={voteMutation.isLoading}
        className={`vote-button ${isDownvoted ? 'vote-button-active-down' : 'vote-button-down'}`}
        title="Downvote"
      >
        {isDownvoted ? (
          <HandThumbDownIconSolid className="h-4 w-4" />
        ) : (
          <HandThumbDownIcon className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}
