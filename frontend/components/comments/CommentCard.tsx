'use client';

import { useState } from 'react';
import { Comment } from '@/types';
import VoteButtons from '@/components/posts/VoteButtons';
import CommentForm from './CommentForm';
import { useAuth } from '@/contexts/AuthContext';

interface CommentCardProps {
  comment: Comment;
  onVote: (commentId: string, voteType: number) => void;
  onUpdate: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  onReply: () => void;
  showReplyForm: boolean;
  onReplyAdded: (comment: Comment) => void;
  onCloseReplyForm: () => void;
}

export default function CommentCard({
  comment,
  onVote,
  onUpdate,
  onDelete,
  onReply,
  showReplyForm,
  onReplyAdded,
  onCloseReplyForm,
}: CommentCardProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isAuthor = user && user.id === comment.author_id;
  const canEdit = isAuthor && !comment.is_deleted;
  const canDelete = isAuthor && !comment.is_deleted;

  const handleEdit = async () => {
    if (editContent.trim() === '') return;

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editContent }),
      });

      if (response.ok) {
        const data = await response.json();
        onUpdate(data.comment);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Fehler beim Bearbeiten des Kommentars:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Möchtest du diesen Kommentar wirklich löschen?')) return;

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete(comment.id);
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Kommentars:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'vor wenigen Minuten';
    } else if (diffInHours < 24) {
      return `vor ${diffInHours} Stunde${diffInHours > 1 ? 'n' : ''}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `vor ${diffInDays} Tag${diffInDays > 1 ? 'en' : ''}`;
      } else {
        return date.toLocaleDateString('de-DE');
      }
    }
  };

  return (
    <div className="card">
      <div className="flex gap-3">
        {/* Vote Buttons */}
        <div className="flex-shrink-0">
          <VoteButtons
            score={comment.score}
            upvotes={comment.upvotes}
            downvotes={comment.downvotes}
            userVote={comment.user_vote}
            onVote={(voteType) => onVote(comment.id, voteType)}
            size="sm"
          />
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Comment Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-white">
              {comment.author_display_name || comment.author_username}
            </span>
            <span className="text-gray-400 text-sm">
              {formatDate(comment.created_at)}
            </span>
            {comment.updated_at !== comment.created_at && (
              <span className="text-gray-500 text-xs">
                (bearbeitet)
              </span>
            )}
          </div>

          {/* Comment Body */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="input w-full min-h-[100px] resize-none"
                placeholder="Kommentar bearbeiten..."
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  className="btn btn-primary btn-sm"
                >
                  Speichern
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <div className="text-gray-200 whitespace-pre-wrap break-words">
              {comment.is_deleted ? (
                <span className="italic text-gray-500">[Gelöscht]</span>
              ) : (
                comment.content
              )}
            </div>
          )}

          {/* Comment Actions */}
          {!comment.is_deleted && (
            <div className="flex items-center gap-4 mt-3 text-sm">
              <button
                onClick={onReply}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Antworten
              </button>
              
              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Bearbeiten
                </button>
              )}
              
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  Löschen
                </button>
              )}
            </div>
          )}

          {/* Reply Form */}
          {showReplyForm && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <CommentForm
                postId={comment.post_id}
                parentId={comment.id}
                onCommentAdded={onReplyAdded}
                onCancel={onCloseReplyForm}
                placeholder={`Antwort an ${comment.author_display_name || comment.author_username}...`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
