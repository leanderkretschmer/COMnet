'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onCommentAdded: (comment: any) => void;
  onCancel?: () => void;
  placeholder?: string;
}

export default function CommentForm({
  postId,
  parentId,
  onCommentAdded,
  onCancel,
  placeholder = 'Schreibe einen Kommentar...',
}: CommentFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-400">
          <a href="/login" className="text-olive-500 hover:text-olive-400">
            Melde dich an
          </a>
          {' '}um zu kommentieren.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          parent_id: parentId || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onCommentAdded(data.comment);
        setContent('');
      } else {
        const error = await response.json();
        alert(error.error || 'Fehler beim Erstellen des Kommentars');
      }
    } catch (error) {
      console.error('Fehler beim Erstellen des Kommentars:', error);
      alert('Fehler beim Erstellen des Kommentars');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="input w-full min-h-[100px] resize-none"
          maxLength={2000}
          required
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-400">
            {content.length}/2000 Zeichen
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!content.trim() || loading}
          className="btn btn-primary btn-sm"
        >
          {loading ? 'Wird gesendet...' : 'Kommentar senden'}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary btn-sm"
          >
            Abbrechen
          </button>
        )}
      </div>
    </form>
  );
}
