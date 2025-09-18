'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { 
  ChatBubbleLeftIcon, 
  ShareIcon, 
  BookmarkIcon,
  FlagIcon
} from '@heroicons/react/24/outline'
import { 
  HandThumbUpIcon, 
  HandThumbDownIcon 
} from '@heroicons/react/24/solid'
import { VoteButtons } from './VoteButtons'

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

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { 
    addSuffix: true, 
    locale: de 
  })

  return (
    <article className="card hover:shadow-md transition-shadow duration-200">
      <div className="card-body">
        {/* Header */}
        <div className="flex items-start space-x-3 mb-3">
          {/* Community Icon */}
          <div className="flex-shrink-0">
            {post.community.icon_url ? (
              <img
                className="h-8 w-8 rounded-full"
                src={post.community.icon_url}
                alt={post.community.display_name}
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-semibold text-sm">
                  {post.community.display_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Post Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Link 
                href={`/c/${post.community.name}`}
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                c/{post.community.name}
              </Link>
              <span>•</span>
              <span>von</span>
              <Link 
                href={`/u/${post.author.username}`}
                className="font-medium text-gray-900 hover:text-primary-600"
              >
                u/{post.author.username}
              </Link>
              <span>•</span>
              <time dateTime={post.created_at}>
                {timeAgo}
              </time>
            </div>
          </div>

          {/* Post Actions */}
          <div className="flex items-center space-x-1">
            {post.is_pinned && (
              <span className="badge badge-warning">Gepinnt</span>
            )}
            {post.is_nsfw && (
              <span className="badge badge-danger">NSFW</span>
            )}
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <FlagIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          <Link 
            href={`/posts/${post.id}`}
            className="hover:text-primary-600 transition-colors duration-200"
          >
            {post.title}
          </Link>
        </h2>

        {/* Content Preview */}
        {post.content && (
          <div className="text-gray-700 mb-4">
            <p className="line-clamp-3">
              {post.content.length > 200 
                ? `${post.content.substring(0, 200)}...` 
                : post.content
              }
            </p>
          </div>
        )}

        {/* Media Preview */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="mb-4">
            {post.content_type === 'image' && (
              <img
                src={post.media_urls[0]}
                alt="Post content"
                className="max-w-full h-auto rounded-lg"
              />
            )}
            {post.content_type === 'video' && (
              <video
                src={post.media_urls[0]}
                controls
                className="max-w-full h-auto rounded-lg"
              >
                Ihr Browser unterstützt das Video-Element nicht.
              </video>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Vote Section */}
          <VoteButtons 
            postId={post.id}
            score={post.score}
            upvotes={post.upvotes}
            downvotes={post.downvotes}
          />

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <Link
              href={`/posts/${post.id}`}
              className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
            >
              <ChatBubbleLeftIcon className="h-4 w-4" />
              <span className="text-sm">{post.comment_count}</span>
            </Link>
            
            <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700">
              <ShareIcon className="h-4 w-4" />
              <span className="text-sm">Teilen</span>
            </button>
            
            <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700">
              <BookmarkIcon className="h-4 w-4" />
              <span className="text-sm">Speichern</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
