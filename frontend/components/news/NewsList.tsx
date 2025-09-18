'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { ExternalLinkIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: {
    id: string;
    name: string;
    profileImage: string;
    category: string;
  };
}

interface NewsListProps {
  limit?: number;
  showSource?: boolean;
}

export default function NewsList({ limit = 20, showSource = true }: NewsListProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/news/feed');
        if (response.ok) {
          const data = await response.json();
          setNews(data.items.slice(0, limit));
        } else {
          setError('Fehler beim Laden der News');
        }
      } catch (error) {
        console.error('Fehler beim Laden der News:', error);
        setError('Fehler beim Laden der News');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [limit]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: de 
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Keine News verfügbar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {news.map((item, index) => (
        <article key={index} className="card hover:shadow-lg transition-shadow duration-200">
          <div className="card-body">
            <div className="flex items-start space-x-3">
              {/* Source Image */}
              {showSource && (
                <div className="flex-shrink-0">
                  {item.source.profileImage ? (
                    <img
                      src={item.source.profileImage}
                      alt={item.source.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-olive-500 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {item.source.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                {showSource && (
                  <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
                    <span className="font-medium text-olive-400">
                      {item.source.name}
                    </span>
                    <span>•</span>
                    <span>{formatDate(item.pubDate)}</span>
                    <span className="badge badge-gray text-xs">
                      {item.source.category}
                    </span>
                  </div>
                )}

                {/* Title */}
                <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-olive-400 transition-colors"
                  >
                    {item.title}
                  </a>
                </h3>

                {/* Description */}
                {item.description && (
                  <p className="text-gray-300 text-sm line-clamp-3 mb-3">
                    {item.description}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    {!showSource && (
                      <span>{formatDate(item.pubDate)}</span>
                    )}
                  </div>
                  
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-olive-400 hover:text-olive-300 transition-colors text-sm"
                  >
                    <span>Lesen</span>
                    <ExternalLinkIcon className="h-4 w-4 ml-1" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
