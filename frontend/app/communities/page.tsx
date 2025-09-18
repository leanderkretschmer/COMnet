'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CommunityList } from '@/components/communities/CommunityList';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function CommunitiesPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Communities</h1>
              <p className="text-gray-400 mt-2">
                Entdecke Communities und trete interessanten Diskussionen bei
              </p>
            </div>
            {user && (
              <button className="btn btn-primary">
                <PlusIcon className="h-5 w-5 mr-2" />
                Community erstellen
              </button>
            )}
          </div>

          {/* Search */}
          <div className="max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Communities durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input w-full pl-10"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-white">
                  Alle Communities
                </h2>
              </div>
              <div className="card-body p-0">
                <CommunityList />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Info Card */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-white">
                    Über Communities
                  </h3>
                </div>
                <div className="card-body">
                  <p className="text-gray-300 text-sm mb-4">
                    Communities sind thematische Bereiche, in denen du dich mit anderen 
                    Nutzern über spezifische Themen austauschen kannst.
                  </p>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-olive-500 rounded-full"></div>
                      <span>Öffentliche Communities</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-olive-500 rounded-full"></div>
                      <span>Private Communities</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-olive-500 rounded-full"></div>
                      <span>Moderierte Inhalte</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              {user && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-white">
                      Schnellaktionen
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="space-y-3">
                      <button className="btn btn-primary w-full">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Community erstellen
                      </button>
                      <button className="btn btn-secondary w-full">
                        Meine Communities
                      </button>
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
