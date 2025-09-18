'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BellIcon, BellSlashIcon } from '@heroicons/react/24/outline';

interface NewsChannel {
  id: string;
  name: string;
  description: string;
  profileImage: string;
  category: string;
  language: string;
}

interface NewsChannelCardProps {
  channel: NewsChannel;
  isSubscribed?: boolean;
  onSubscribe?: (channelId: string) => void;
  onUnsubscribe?: (channelId: string) => void;
}

export default function NewsChannelCard({
  channel,
  isSubscribed = false,
  onSubscribe,
  onUnsubscribe,
}: NewsChannelCardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubscriptionToggle = async () => {
    if (!user || loading) return;

    setLoading(true);
    try {
      if (isSubscribed) {
        await fetch(`/api/news/unsubscribe/${channel.id}`, {
          method: 'DELETE',
        });
        onUnsubscribe?.(channel.id);
      } else {
        await fetch(`/api/news/subscribe/${channel.id}`, {
          method: 'POST',
        });
        onSubscribe?.(channel.id);
      }
    } catch (error) {
      console.error('Fehler beim Ändern des Abonnements:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-start space-x-4">
          {/* Channel Image */}
          <div className="flex-shrink-0">
            {channel.profileImage ? (
              <img
                src={channel.profileImage}
                alt={channel.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-olive-500 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {channel.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Channel Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">
              {channel.name}
            </h3>
            {channel.description && (
              <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                {channel.description}
              </p>
            )}
            <div className="flex items-center space-x-2 mt-2">
              <span className="badge badge-gray text-xs">
                {channel.category}
              </span>
              <span className="badge badge-gray text-xs">
                {channel.language.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Subscribe Button */}
          {user && (
            <div className="flex-shrink-0">
              <button
                onClick={handleSubscriptionToggle}
                disabled={loading}
                className={`btn btn-sm ${
                  isSubscribed 
                    ? 'btn-secondary' 
                    : 'btn-primary'
                }`}
              >
                {loading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                ) : isSubscribed ? (
                  <>
                    <BellSlashIcon className="h-4 w-4 mr-1" />
                    Abonniert
                  </>
                ) : (
                  <>
                    <BellIcon className="h-4 w-4 mr-1" />
                    Abonnieren
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
