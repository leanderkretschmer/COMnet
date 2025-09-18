'use client';

import { useState, useEffect } from 'react';
import { Comment } from '@/types';
import CommentCard from './CommentCard';
import CommentForm from './CommentForm';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface CommentListProps {
  postId: string;
  initialComments?: Comment[];
  totalComments?: number;
}

export default function CommentList({ postId, initialComments = [], totalComments = 0 }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialComments.length < totalComments);
  const [showReplyForm, setShowReplyForm] = useState<string | null>(null);

  const loadComments = async (pageNum: number = 1, append: boolean = false) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments?page=${pageNum}&limit=20&sort=new`);
      if (response.ok) {
        const data = await response.json();
        if (append) {
          setComments(prev => [...prev, ...data.comments]);
        } else {
          setComments(data.comments);
        }
        setHasMore(data.pagination.hasNext);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Kommentare:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadComments(nextPage, true);
  };

  const handleCommentAdded = (newComment: Comment) => {
    setComments(prev => [newComment, ...prev]);
    setShowReplyForm(null);
  };

  const handleCommentUpdated = (updatedComment: Comment) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === updatedComment.id ? updatedComment : comment
      )
    );
  };

  const handleCommentDeleted = (commentId: string) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, is_deleted: true, content: '[Gelöscht]' }
          : comment
      )
    );
  };

  const handleVote = async (commentId: string, voteType: number) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vote_type: voteType }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev =>
          prev.map(comment =>
            comment.id === commentId
              ? {
                  ...comment,
                  score: data.score,
                  upvotes: data.upvotes,
                  downvotes: data.downvotes,
                  user_vote: data.user_vote,
                }
              : comment
          )
        );
      }
    } catch (error) {
      console.error('Fehler beim Abstimmen:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Kommentar-Formular */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-white">Kommentar schreiben</h3>
        </div>
        <div className="card-body">
          <CommentForm
            postId={postId}
            onCommentAdded={handleCommentAdded}
            placeholder="Schreibe einen Kommentar..."
          />
        </div>
      </div>

      {/* Kommentar-Liste */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Noch keine Kommentare. Sei der Erste!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onVote={handleVote}
              onUpdate={handleCommentUpdated}
              onDelete={handleCommentDeleted}
              onReply={() => setShowReplyForm(comment.id)}
              showReplyForm={showReplyForm === comment.id}
              onReplyAdded={handleCommentAdded}
              onCloseReplyForm={() => setShowReplyForm(null)}
            />
          ))
        )}
      </div>

      {/* Mehr laden Button */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="btn btn-secondary"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Mehr Kommentare laden'}
          </button>
        </div>
      )}
    </div>
  );
}
