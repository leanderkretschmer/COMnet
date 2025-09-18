'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import NewsList from '@/components/news/NewsList';
import NewsChannelList from '@/components/news/NewsChannelList';
import { NewspaperIcon, BellIcon } from '@heroicons/react/24/outline';

export default function NewsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'channels'>('feed');

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <NewspaperIcon className="h-8 w-8 text-olive-400" />
            <h1 className="text-3xl font-bold text-white">News</h1>
          </div>
          <p className="text-gray-400">
            Bleibe auf dem Laufenden mit den neuesten Nachrichten aus deinen abonnierten Quellen.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('feed')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'feed'
                    ? 'border-olive-500 text-olive-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <NewspaperIcon className="h-5 w-5 inline mr-2" />
                News Feed
              </button>
              <button
                onClick={() => setActiveTab('channels')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'channels'
                    ? 'border-olive-500 text-olive-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <BellIcon className="h-5 w-5 inline mr-2" />
                Channels
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'feed' ? (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Aktuelle Nachrichten
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Die neuesten Artikel aus allen verfügbaren Quellen
                  </p>
                </div>
                <NewsList limit={20} showSource={true} />
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white mb-2">
                    News-Channels
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {user 
                      ? 'Abonniere News-Channels, um deren Artikel in deinem Feed zu sehen'
                      : 'Melde dich an, um News-Channels zu abonnieren'
                    }
                  </p>
                </div>
                <NewsChannelList />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Info Card */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-white">
                    Über News
                  </h3>
                </div>
                <div className="card-body">
                  <p className="text-gray-300 text-sm mb-4">
                    COMNet integriert RSS-Feeds von verschiedenen Nachrichtenquellen. 
                    Abonniere Channels, um deren Artikel automatisch in deinem Feed zu sehen.
                  </p>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-olive-500 rounded-full"></div>
                      <span>Automatische Updates</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-olive-500 rounded-full"></div>
                      <span>Personalisierte Feeds</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-olive-500 rounded-full"></div>
                      <span>Verschiedene Quellen</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              {user && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-white">
                      Deine Abonnements
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-olive-400 mb-1">
                        {/* This would be dynamic in a real app */}
                        1
                      </div>
                      <p className="text-gray-400 text-sm">
                        Abonnierte Channels
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
