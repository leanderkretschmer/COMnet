'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import NewsChannelCard from './NewsChannelCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface NewsChannel {
  id: string;
  name: string;
  description: string;
  profileImage: string;
  category: string;
  language: string;
}

interface Subscription {
  id: string;
  source_id: string;
  name: string;
  description: string;
  profile_image: string;
  category: string;
  language: string;
  subscribed_at: string;
}

export default function NewsChannelList() {
  const { user } = useAuth();
  const [channels, setChannels] = useState<NewsChannel[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [channelsResponse, subscriptionsResponse] = await Promise.all([
          fetch('/api/news/sources'),
          user ? fetch('/api/news/subscriptions') : Promise.resolve({ ok: false })
        ]);

        if (channelsResponse.ok) {
          const channelsData = await channelsResponse.json();
          setChannels(channelsData.sources);
        }

        if (user && subscriptionsResponse.ok) {
          const subscriptionsData = await subscriptionsResponse.json();
          setSubscriptions(subscriptionsData.subscriptions);
        }
      } catch (error) {
        console.error('Fehler beim Laden der News-Channels:', error);
        setError('Fehler beim Laden der News-Channels');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSubscribe = (channelId: string) => {
    setSubscriptions(prev => {
      const channel = channels.find(c => c.id === channelId);
      if (!channel) return prev;
      
      return [...prev, {
        id: '',
        source_id: channelId,
        name: channel.name,
        description: channel.description,
        profile_image: channel.profileImage,
        category: channel.category,
        language: channel.language,
        subscribed_at: new Date().toISOString()
      }];
    });
  };

  const handleUnsubscribe = (channelId: string) => {
    setSubscriptions(prev => prev.filter(sub => sub.source_id !== channelId));
  };

  const isSubscribed = (channelId: string) => {
    return subscriptions.some(sub => sub.source_id === channelId);
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

  return (
    <div className="space-y-4">
      {channels.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">Keine News-Channels verfügbar</p>
        </div>
      ) : (
        channels.map((channel) => (
          <NewsChannelCard
            key={channel.id}
            channel={channel}
            isSubscribed={isSubscribed(channel.id)}
            onSubscribe={handleSubscribe}
            onUnsubscribe={handleUnsubscribe}
          />
        ))
      )}
    </div>
  );
}
