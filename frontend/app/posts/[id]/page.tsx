'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  ChatBubbleLeftIcon, 
  ShareIcon, 
  BookmarkIcon,
  FlagIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import VoteButtons from '@/components/posts/VoteButtons';
import CommentList from '@/components/comments/CommentList';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Post } from '@/types';

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.id as string;
  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts/${postId}`);
        if (response.ok) {
          const data = await response.json();
          setPost(data.post);
        } else {
          setError('Post nicht gefunden');
        }
      } catch (error) {
        console.error('Fehler beim Laden des Posts:', error);
        setError('Fehler beim Laden des Posts');
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const handleVote = async (voteType: number) => {
    if (!post) return;

    try {
      const response = await fetch(`/api/posts/${post.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vote_type: voteType }),
      });

      if (response.ok) {
        const data = await response.json();
        setPost(prev => prev ? {
          ...prev,
          score: data.score,
          upvotes: data.upvotes,
          downvotes: data.downvotes,
          user_vote: data.user_vote,
        } : null);
      }
    } catch (error) {
      console.error('Fehler beim Abstimmen:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Post nicht gefunden</h1>
          <Link href="/" className="btn btn-primary">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { 
    addSuffix: true, 
    locale: de 
  });

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Zurück zur Startseite
          </Link>
        </div>

        {/* Post */}
        <article className="card mb-6">
          <div className="card-body">
            {/* Header */}
            <div className="flex items-start space-x-3 mb-4">
              {/* Community Icon */}
              <div className="flex-shrink-0">
                {post.community?.icon_url ? (
                  <img
                    className="h-10 w-10 rounded-full"
                    src={post.community.icon_url}
                    alt={post.community.title}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-olive-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {post.community?.title?.charAt(0).toUpperCase() || 'C'}
                    </span>
                  </div>
                )}
              </div>

              {/* Post Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Link 
                    href={`/c/${post.community?.name}`}
                    className="font-medium text-olive-400 hover:text-olive-300"
                  >
                    c/{post.community?.name}
                  </Link>
                  <span>•</span>
                  <span>von</span>
                  <Link 
                    href={`/u/${post.author?.username}`}
                    className="font-medium text-white hover:text-olive-400"
                  >
                    u/{post.author?.username}
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
                <button className="p-1 text-gray-400 hover:text-gray-300">
                  <FlagIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-white mb-4">
              {post.title}
            </h1>

            {/* Content */}
            {post.content && (
              <div className="text-gray-200 mb-6 whitespace-pre-wrap">
                {post.content}
              </div>
            )}

            {/* Media */}
            {post.media_url && (
              <div className="mb-6">
                {post.type === 'image' && (
                  <img
                    src={post.media_url}
                    alt="Post content"
                    className="max-w-full h-auto rounded-lg"
                  />
                )}
                {post.type === 'video' && (
                  <video
                    src={post.media_url}
                    controls
                    className="max-w-full h-auto rounded-lg"
                  >
                    Ihr Browser unterstützt das Video-Element nicht.
                  </video>
                )}
                {post.type === 'link' && post.link_url && (
                  <a
                    href={post.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-olive-500 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <p className="text-white font-medium">Externer Link</p>
                        <p className="text-gray-400 text-sm truncate">{post.link_url}</p>
                      </div>
                      <div className="text-olive-400">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </div>
                  </a>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              {/* Vote Section */}
              <VoteButtons 
                postId={post.id}
                score={post.score}
                upvotes={post.upvotes}
                downvotes={post.downvotes}
                userVote={post.user_vote}
                onVote={handleVote}
                size="lg"
              />

              {/* Action Buttons */}
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2 text-gray-400">
                  <ChatBubbleLeftIcon className="h-5 w-5" />
                  <span className="text-sm">{post.comment_count} Kommentare</span>
                </div>
                
                <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                  <ShareIcon className="h-5 w-5" />
                  <span className="text-sm">Teilen</span>
                </button>
                
                <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                  <BookmarkIcon className="h-5 w-5" />
                  <span className="text-sm">Speichern</span>
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* Comments */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-white">
              Kommentare ({post.comment_count})
            </h2>
          </div>
          <div className="card-body">
            <CommentList 
              postId={post.id}
              initialComments={[]}
              totalComments={post.comment_count}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
